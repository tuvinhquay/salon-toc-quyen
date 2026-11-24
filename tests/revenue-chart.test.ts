import { describe, expect, it } from 'vitest'
import { buildRevenueBuckets } from '../src/app/PosReportsPages'
import type { Expense, Payment, Refund } from '../src/db/types'

describe('revenue chart aggregation', () => {
  it('creates daily buckets and sums real payments and expenses', () => {
    const start = new Date(2026, 10, 1, 0, 0)
    const end = new Date(2026, 10, 3, 0, 0)
    const payments = [{ paidAt: new Date(2026, 10, 1, 12).toISOString(), amountVnd: 500000, status: 'completed' }] as unknown as Payment[]
    const expenses = [{ paidAt: new Date(2026, 10, 2, 12).toISOString(), amountVnd: 120000 }] as unknown as Expense[]
    const refunds = [{ refundedAt: new Date(2026, 10, 1, 15).toISOString(), amountVnd: 50000 }] as unknown as Refund[]
    const rows = buildRevenueBuckets(payments, expenses, refunds, start.toISOString(), end.toISOString())
    expect(rows).toHaveLength(2)
    expect(rows[0].collected).toBe(500000)
    expect(rows[0].refunded).toBe(50000)
    expect(rows[1].expenses).toBe(120000)
  })

  it('uses monthly buckets for ranges longer than 45 days', () => {
    const start = new Date(2026, 0, 1)
    const end = new Date(2026, 3, 1)
    const rows = buildRevenueBuckets([], [], [], start.toISOString(), end.toISOString())
    expect(rows).toHaveLength(3)
  })

  it('includes a selected end date when the end time is not midnight', () => {
    const start = new Date(2026, 10, 24, 0, 0)
    const end = new Date(2026, 10, 24, 23, 59)
    const rows = buildRevenueBuckets([], [], [], start.toISOString(), end.toISOString())
    expect(rows).toHaveLength(1)
  })
})
