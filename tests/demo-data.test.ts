import { describe, expect, it } from 'vitest'
import { createFiveMonthBundle, getFiveMonthDemoPeriod } from '../src/db/demo-data'

describe('five-month demo date range', () => {
  it('covers the current month and four previous calendar months', () => {
    const period = getFiveMonthDemoPeriod(new Date(2026, 10, 25, 12, 30))
    const start = new Date(period.startAt)
    const end = new Date(period.endAt)
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(6)
    expect(start.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(10)
    expect(end.getDate()).toBe(25)
  })

  it('rolls across a year boundary correctly', () => {
    const period = getFiveMonthDemoPeriod(new Date(2027, 0, 3, 12))
    const start = new Date(period.startAt)
    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(8)
    expect(start.getDate()).toBe(1)
  })
})

describe('five-month business bundle', () => {
  it('creates tenant-scoped linked records with balanced invoice totals and stock', () => {
    const actor = { salonId: 'salon_demo_test', actorId: 'owner_demo_test', deviceId: 'device_demo_test' }
    const bundle = createFiveMonthBundle(actor, new Date(2026, 10, 25, 12))
    const prefix = 'demo_' + actor.salonId + '_'
    expect(bundle.customers).toHaveLength(120)
    expect(bundle.employees).toHaveLength(10)
    expect(bundle.services).toHaveLength(8)
    expect(bundle.products).toHaveLength(12)
    expect(bundle.invoices).toHaveLength(288)
    expect(bundle.purchaseOrders).toHaveLength(5)
    expect(bundle.lots).toHaveLength(60)
    expect(bundle.invoices.every(invoice => invoice.id.startsWith(prefix))).toBe(true)
    expect(bundle.customers.every(customer => customer.phone?.startsWith('000000'))).toBe(true)
    expect(new Set(bundle.invoices.map(invoice => invoice.issuedAt.slice(0, 7))).size).toBe(5)

    for (const invoice of bundle.invoices) {
      expect(bundle.customers.some(customer => customer.id === invoice.customerId)).toBe(true)
      expect(invoice.totalVnd).toBe(invoice.lines.reduce((sum, line) => sum + line.totalVnd, 0))
      expect(invoice.lines.every(line => !!line.employeeId && !!line.employeeNameSnapshot)).toBe(true)
      expect(bundle.payments.some(payment => payment.invoiceId === invoice.id && payment.amountVnd === invoice.totalVnd)).toBe(true)
    }

    for (const product of bundle.products) {
      const received = bundle.movements.filter(movement => movement.productId === product.id && movement.direction === 'in').reduce((sum, movement) => sum + movement.quantity, 0)
      const consumed = bundle.movements.filter(movement => movement.productId === product.id && movement.direction === 'out').reduce((sum, movement) => sum + movement.quantity, 0)
      const remaining = bundle.lots.filter(lot => lot.productId === product.id).reduce((sum, lot) => sum + lot.quantityRemaining, 0)
      expect(received - consumed).toBeCloseTo(remaining, 5)
      expect(remaining).toBeGreaterThanOrEqual(0)
    }
  })
})
