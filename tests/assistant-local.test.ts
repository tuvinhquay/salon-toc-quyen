import { describe, expect, it } from 'vitest'
import { detectAssistantIntent, detectAssistantPeriod, findCustomerLookupMatches, getAssistantRange, isCustomerLookupRequest, answerOwnerQuestion } from '../src/app/assistant-local'
import { answerFromGuide, isGuideQuestion } from '../src/app/guide-content'
import type { Customer } from '../src/db/types'

describe('assistant question understanding', () => {
  it('recognizes finance, staff, customer and stock questions', () => {
    expect(detectAssistantIntent('Hôm nay tiệm làm được bao nhiêu tiền?')).toBe('finance')
    expect(detectAssistantIntent('Nhân viên nào làm được nhiều nhất?')).toBe('staff')
    expect(detectAssistantIntent('Khách hàng nào đặt lịch nhiều nhất?')).toBe('customers')
    expect(detectAssistantIntent('Mặt hàng nào sắp hết?')).toBe('inventory')
    expect(detectAssistantIntent('Tìm thông tin nhân viên Hoàng Gia Hân số điện thoại 0909446008')).toBe('staff')
    expect(detectAssistantIntent('Liệt kê khách mua nhiều sản phẩm nhất quý này')).toBe('customers')
    expect(detectAssistantIntent('Khách hàng chi tiêu nhiều nhất trong tháng')).toBe('customers')
  })
  it('routes help and app-use questions to the built-in guide', () => {\n    expect(detectAssistantIntent('Hướng dẫn mình cách tạo lịch hẹn')).toBe('guide')\n    expect(isGuideQuestion('Cách lập hóa đơn cho khách')).toBe(true)\n    expect(answerFromGuide('Cách lập hóa đơn cho khách')).toContain('Phát hành hóa đơn')\n    expect(answerFromGuide('Ứng dụng có những tính năng nào?')).toContain('Các mục chính')\n  })\n  it('recognizes Vietnam calendar periods', () => {
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
    expect(quarter.end.toISOString()).toBe('2026-12-31T17:00:00.000Z')
    const year = getAssistantRange('year', now)
    expect(year.start.toISOString()).toBe('2025-12-31T17:00:00.000Z')
    expect(year.end.toISOString()).toBe('2026-12-31T17:00:00.000Z')
  })
})


const customer = (id: string, fullName: string, phone: string | null = null): Customer => ({
  id, salonId: 'salon_test', fullName,
  normalizedName: fullName.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'),
  phone, normalizedPhone: phone?.replace(/\D/g, '') ?? null, email: null, notes: '', archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', revision: 1,
  createdBy: 'owner', updatedBy: 'owner', deviceId: 'device',
})

describe('assistant entity lookup routing', () => {
  const customers = [
    customer('c1', 'Bùi Hoàng Mai Phương', '0901234567'),
    customer('c2', 'Lê Gia Mai Phương', '0902222222'),
    customer('c3', 'Nguyễn Gia Hân', '0903333333'),
  ]

  it('routes a named customer question to the matching profile, not customer rankings', () => {
    expect(isCustomerLookupRequest('Khách hàng Bùi Hoàng Mai Phương')).toBe(true)
    expect(findCustomerLookupMatches(customers, 'Khách hàng Bùi Hoàng Mai Phương').map(row => row.id)).toEqual(['c1'])
  })

  it('supports partial name and phone lookup with ambiguity preserved', () => {
    expect(findCustomerLookupMatches(customers, 'Tìm khách Mai').map(row => row.id)).toEqual(['c1', 'c2'])
    expect(findCustomerLookupMatches(customers, 'Tra cứu khách 0901234567').map(row => row.id)).toEqual(['c1'])
  })

  it('does not treat a ranking request as a named-customer search', () => {
    const question = 'Khách hàng nào chi tiêu nhiều nhất trong tháng này?'
    expect(isCustomerLookupRequest(question)).toBe(false)
    expect(findCustomerLookupMatches(customers, question)).toEqual([])
  })

  it('excludes archived customers from lookup', () => {
    const archived = { ...customers[0], archivedAt: '2026-01-02T00:00:00.000Z' }
    expect(findCustomerLookupMatches([archived], 'Khách hàng Bùi Hoàng Mai Phương')).toEqual([])
  })
})
