import { describe, expect, it } from 'vitest'
import { detectAssistantIntent, detectAssistantPeriod, getAssistantRange } from '../src/app/assistant-local'

describe('assistant question understanding', () => {
  it('recognizes finance, staff, customer and stock questions', () => {
    expect(detectAssistantIntent('Hôm nay tiệm làm được bao nhiêu tiền?')).toBe('finance')
    expect(detectAssistantIntent('Nhân viên nào làm được nhiều nhất?')).toBe('staff')
    expect(detectAssistantIntent('Khách hàng nào đặt lịch nhiều nhất?')).toBe('customers')
    expect(detectAssistantIntent('Mặt hàng nào sắp hết?')).toBe('inventory')
  })
  it('recognizes Vietnam calendar periods', () => {
    expect(detectAssistantPeriod('Doanh thu năm nay')).toBe('year')
    expect(detectAssistantPeriod('Tháng này có bao nhiêu lịch?')).toBe('month')
    expect(detectAssistantPeriod('Tổng kết tình hình kinh doanh quý này')).toBe('quarter')
    expect(detectAssistantPeriod('Hôm nay thu được bao nhiêu?')).toBe('today')
  })
  it('uses Asia/Ho_Chi_Minh midnight boundaries', () => {
    const now = new Date('2026-11-23T05:00:00.000Z')
    const today = getAssistantRange('today', now)
    expect(today.start.toISOString()).toBe('2026-11-22T17:00:00.000Z')
    expect(today.end.toISOString()).toBe('2026-11-23T17:00:00.000Z')
    const month = getAssistantRange('month', now)
    expect(month.start.toISOString()).toBe('2026-10-31T17:00:00.000Z')
    expect(month.end.toISOString()).toBe('2026-11-30T17:00:00.000Z')
    const quarter = getAssistantRange('quarter', now)
    expect(quarter.label).toBe('quý 4/2026')
    expect(quarter.start.toISOString()).toBe('2026-09-30T17:00:00.000Z')
    expect(quarter.end.toISOString()).toBe('2026-12-31T17:00:00.000Z')\n    const year = getAssistantRange('year', now)
    expect(year.start.toISOString()).toBe('2025-12-31T17:00:00.000Z')
    expect(year.end.toISOString()).toBe('2026-12-31T17:00:00.000Z')
  })
})
