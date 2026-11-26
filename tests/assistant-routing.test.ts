import { describe, expect, it } from 'vitest'
import { classifyAssistantRoute, sanitizeQuestionForGemini } from '../src/app/assistant-routing'
import type { AssistantIntent } from '../src/app/assistant-local'

describe('assistant routing', () => {
  it('sends ordinary conversation and creative requests directly to Gemini', () => {
    expect(classifyAssistantRoute('Bạn biết làm thơ không?', 'general')).toBe('chat')
    expect(classifyAssistantRoute('Kể cho mình một câu chuyện vui', 'general')).toBe('chat')
  })
  it('keeps exact business lookups local by default', () => {
    const cases: Array<[string, AssistantIntent]> = [
      ['Doanh thu hôm nay bao nhiêu?', 'finance'],
      ['Tìm sản phẩm dầu gội trong kho', 'inventory'],
      ['Tìm thông tin nhân viên Lan', 'staff'],
      ['Khách hàng nào đặt lịch nhiều nhất?', 'customers'],
      ['Hướng dẫn cách tạo lịch hẹn', 'guide'],
    ]
    for (const [question, intent] of cases) expect(classifyAssistantRoute(question, intent)).toBe('local')
  })
  it('combines verified local business context with Gemini for advice', () => {
    expect(classifyAssistantRoute('Tư vấn giúp mình cải thiện doanh thu tiệm', 'overview')).toBe('hybrid')
    expect(classifyAssistantRoute('Có nên tăng giá dịch vụ không?', 'services')).toBe('hybrid')
    expect(classifyAssistantRoute('Lập kế hoạch marketing cho tiệm', 'general')).toBe('hybrid')
  })
})

describe('Gemini conversation privacy', () => {
  it('removes email addresses and phone numbers without reading salon data', () => {
    const safe = sanitizeQuestionForGemini('Viết lời chúc cho khách test@example.com, gọi 0901234567 nhé')
    expect(safe).not.toContain('test@example.com')
    expect(safe).not.toContain('0901234567')
    expect(safe).toContain('[email đã ẩn]')
    expect(safe).toContain('[số điện thoại đã ẩn]')
  })
  it('limits the user prompt length', () => {
    expect(sanitizeQuestionForGemini('x'.repeat(5000))).toHaveLength(4000)
  })
})
