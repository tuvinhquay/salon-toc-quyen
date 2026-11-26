import { describe, expect, it } from 'vitest'
import { buildRevenueBuckets, getDefaultReportRange } from '../src/app/PosReportsPages'
import type { Expense, Payment, Refund } from '../src/db/types'

describe('revenue chart aggregation', () => {\n  it('defaults to a range covering the five-month demo dataset, through today', () => {\n    const range = getDefaultReportRange(new Date(2026, 10, 26, 12))\n    const start = new Date(range.startAt)\n    const end = new Date(range.endAt)\n    expect(start.getFullYear()).toBe(2026)\n    expect(start.getMonth()).toBe(6)\n    expect(start.getDate()).toBe(1)\n    expect(end.getDate()).toBe(27)\n  })\n\n  it('shows a seeded 25 million VND collected amount in the five-month trend', () => {\n    const start = new Date(2026, 6, 1)\n    const end = new Date(2026, 10, 27)\n    const payments = [{ paidAt: new Date(2026, 7, 15, 12).toISOString(), amountVnd: 25000000, status: 'completed' }] as unknown as Payment[]\n    const rows = buildRevenueBuckets(payments, [], [], start.toISOString(), end.toISOString())\n    expect(rows).toHaveLength(5)\n    expect(rows.reduce((sum, row) => sum + row.collected, 0)).toBe(25000000)\n  })
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
