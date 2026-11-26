import { describe, expect, it } from 'vitest'
import { buildOwnerFinanceAnswer, makeAssistantLanguageFriendly } from '../src/app/assistant-language'

describe('assistant everyday language', () => {
  it('answers a profit question without presenting collected remainder as exact profit', () => {
    const answer = buildOwnerFinanceAnswer('tháng 11/2026', {
      grossInvoiceVnd: 83614140,
      invoiceCount: 71,
      collectedVnd: 83452140,
      refundedVnd: 720197,
      expensesVnd: 57341000,
      remainingVnd: 25390943,
    }, true).join('\n')
    expect(answer).toContain('Tiền còn lại sau khi trừ tiền hoàn và chi phí: **25.390.943 ₫**')
    expect(answer).toContain('Đây chưa phải lợi nhuận cuối cùng')
    expect(answer).not.toContain('thu ròng')
    expect(answer).not.toContain('phân bổ đầy đủ')
  })

  it('converts technical accounting terms to words salon owners use', () => {
    const result = makeAssistantLanguageFriendly('Doanh thu hóa đơn đã phát hành; thu ròng; chi phí đã ghi nhận; giá vốn vật tư.')
    expect(result).toBe('Tổng tiền trên hóa đơn; tiền còn lại sau khi trừ tiền hoàn và chi phí; các khoản chi đã nhập; tiền mua vật tư.')
  })
})
