export type OwnerFinanceSummary = {
  grossInvoiceVnd: number
  invoiceCount: number
  collectedVnd: number
  refundedVnd: number
  expensesVnd: number
  remainingVnd: number
}

const money = (value: number) => Math.round(value).toLocaleString('vi-VN') + ' ₫'

/** Turn internal finance labels into everyday salon-owner language without changing values. */
export function buildOwnerFinanceAnswer(periodLabel: string, summary: OwnerFinanceSummary, asksProfit = false): string[] {
  const lines = [
    '**Tình hình tiệm trong ' + periodLabel + '**',
    '• Tổng tiền trên hóa đơn: **' + money(summary.grossInvoiceVnd) + '** (' + summary.invoiceCount + ' hóa đơn, không tính hóa đơn đã hủy).',
    '• Tiệm đã thu: **' + money(summary.collectedVnd) + '**.',
    '• Tiền đã hoàn lại khách: **' + money(summary.refundedVnd) + '**.',
    '• Các khoản chi đã nhập: **' + money(summary.expensesVnd) + '**.',
    '• Tiền còn lại sau khi trừ tiền hoàn và chi phí: **' + money(summary.remainingVnd) + '**.',
  ]
  if (asksProfit) {
    lines.push('Theo các khoản đã nhập, tiệm hiện còn **' + money(summary.remainingVnd) + '**. Đây chưa phải lợi nhuận cuối cùng vì tiền vật tư, tiền công và hoa hồng có thể chưa được tính đầy đủ.')
  }
  return lines
}

/** Plain-language cleanup for adviser replies while retaining the original financial meaning. */
export function makeAssistantLanguageFriendly(value: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/doanh thu hóa đơn đã phát hành/gi, 'Tổng tiền trên hóa đơn'],
    [/thu ròng sau hoàn tiền và chi phí/gi, 'Tiền còn lại sau khi trừ tiền hoàn và chi phí'],
    [/thu ròng/gi, 'tiền còn lại sau khi trừ tiền hoàn và chi phí'],
    [/chi phí đã ghi nhận/gi, 'các khoản chi đã nhập'],
    [/giá vốn vật tư/gi, 'tiền mua vật tư'],
    [/phân bổ đầy đủ/gi, 'tính đầy đủ'],
    [/phân bổ/gi, 'tính'],
    [/khách không đến/gi, 'khách vắng'],
    [/ngưỡng tồn tối thiểu/gi, 'mức tồn cần có'],
    [/dữ liệu được ghi nhận/gi, 'thông tin đã nhập'],
    [/IndexedDB trên thiết bị hiện tại/gi, 'dữ liệu lưu trên thiết bị này'],
  ]
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}
