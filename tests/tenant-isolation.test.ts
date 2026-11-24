import { beforeEach, describe, expect, it, vi } from 'vitest'

const { db, tables } = vi.hoisted(() => {
  const makeTable = () => {
    const query = {
      equals: vi.fn(() => query),
      and: vi.fn(() => query),
      filter: vi.fn(() => query),
      reverse: vi.fn(() => query),
      sortBy: vi.fn(async () => []),
      toArray: vi.fn(async () => []),
      first: vi.fn(async () => undefined),
    }
    return {
      where: vi.fn(() => query),
      get: vi.fn(async () => undefined as unknown),
      put: vi.fn(async () => undefined),
      add: vi.fn(async () => undefined),
      query,
    }
  }

  const tables = {
    customers: makeTable(),
    appointments: makeTable(),
    services: makeTable(),
    workflowEvents: makeTable(),
    auditEvents: makeTable(),
    employees: makeTable(),
    workShifts: makeTable(),
    commissionPolicies: makeTable(),
    products: makeTable(),
    suppliers: makeTable(),
    purchaseOrders: makeTable(),
    inventoryLots: makeTable(),
    stockMovements: makeTable(),
    invoices: makeTable(),
    payments: makeTable(),
    refunds: makeTable(),
    expenses: makeTable(),
    assistantMemories: makeTable(),
  }

  const db = {
    ...tables,
    transaction: vi.fn(async (_mode: string, ...args: unknown[]) => {
      const callback = args.at(-1)
      if (typeof callback === 'function') await callback()
    }),
  }
  return { db, tables }
})

vi.mock('../src/db/database', () => ({ salonDb: db }))

import { listCustomers, saveCustomer } from '../src/db/repositories'
import { answerOwnerQuestion } from '../src/app/assistant-local'
import { archiveOwnerMemory, listOwnerMemories } from '../src/app/assistant-brain-store'
import type { ActorContext } from '../src/db/types'

const oldTenantActor: ActorContext = { salonId: 'salon-old', actorId: 'owner-old', deviceId: 'device-old' }
const newTenantActor: ActorContext = { salonId: 'salon-new', actorId: 'owner-new', deviceId: 'device-new' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('tenant isolation during account handover', () => {
  it('lists customer records only from the authenticated salon partition', async () => {
    await listCustomers(newTenantActor)

    expect(tables.customers.where).toHaveBeenCalledWith('salonId')
    expect(tables.customers.query.equals).toHaveBeenCalledWith('salon-new')
  })

  it('rejects editing a customer that belongs to the previous salon', async () => {
    tables.customers.get.mockResolvedValue({
      id: 'customer-old',
      salonId: 'salon-old',
      fullName: 'Khách hàng cũ',
      revision: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      createdBy: 'owner-old',
    })

    await expect(saveCustomer(newTenantActor, { fullName: 'Không được sửa' }, 'customer-old'))
      .rejects.toThrow('Không tìm thấy khách hàng trong salon hiện tại.')

    expect(tables.customers.put).not.toHaveBeenCalled()
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('scopes every local assistant business-data query to the active salon', async () => {
    await answerOwnerQuestion('salon-new', 'Tổng quan hôm nay')

    const businessTables = [
      tables.invoices, tables.payments, tables.refunds, tables.expenses,
      tables.appointments, tables.customers, tables.employees, tables.services,
      tables.products, tables.inventoryLots, tables.workShifts,
    ]

    for (const table of businessTables) {
      expect(table.where).toHaveBeenCalledWith('salonId')
      expect(table.query.equals).toHaveBeenCalledWith('salon-new')
    }
  })

  it('scopes long-term memories to both salon and owner identity', async () => {
    await listOwnerMemories('salon-new', 'owner-new')

    expect(tables.assistantMemories.where).toHaveBeenCalledWith('[salonId+ownerId]')
    expect(tables.assistantMemories.query.equals).toHaveBeenCalledWith(['salon-new', 'owner-new'])
  })

  it('does not allow a new owner to archive a memory from the previous owner', async () => {
    tables.assistantMemories.get.mockResolvedValue({
      id: 'memory-old',
      salonId: 'salon-old',
      ownerId: 'owner-old',
      status: 'active',
    })

    await expect(archiveOwnerMemory(newTenantActor, 'memory-old')).resolves.toBe(false)
    expect(tables.assistantMemories.put).not.toHaveBeenCalled()
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('returns no local memory when the tenant or owner identity is missing', async () => {
    await expect(listOwnerMemories('', 'owner-new')).resolves.toEqual([])
    await expect(listOwnerMemories('salon-new', '')).resolves.toEqual([])
    expect(tables.assistantMemories.where).not.toHaveBeenCalled()
  })
})
