import { describe, expect, it } from 'vitest'
import { getFiveMonthDemoPeriod } from '../src/db/demo-data'

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
