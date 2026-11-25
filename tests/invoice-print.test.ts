import { describe, expect, it } from 'vitest'
import type { Invoice, Payment } from '../src/db/types'
import { buildInvoicePrintHtml, type SalonInvoiceProfile } from '../src/lib/invoice-print'

const base = {
  salonId: 'salon_test', createdAt: '2026-11-25T08:00:00.000Z', updatedAt: '2026-11-25T08:00:00.000Z',
  revision: 1, createdBy: 'owner', updatedBy: 'owner', deviceId: 'device',
}
const invoice: Invoice = {
  id: 'invoice_1', ...base, invoiceNumber: 'HD-TEST-001', customerId: 'customer_1',
  customerNameSnapshot: 'Nguyễn Mai Phương <VIP>', customerPhoneSnapshot: '0901234567',
  status: 'paid', issuedAt: '2026-11-25T08:00:00.000Z', subtotalVnd: 300000,
  discountVnd: 10000, taxVnd: 23200, totalVnd: 313200, amountPaidVnd: 313200,
  lines: [{ id: 'line_1', lineType: 'service', referenceId: 'service_1', description: 'Nhuộm & tạo kiểu', quantity: 1, unitPriceVnd: 300000, discountVnd: 10000, taxRatePercent: 8, taxVnd: 23200, totalVnd: 313200, employeeId: 'employee_1', employeeNameSnapshot: 'Lê Thu Trang' }],
  notes: 'Mô phỏng kiểm tra', voidedAt: null,
}
const payment: Payment = { id: 'payment_1', ...base, invoiceId: invoice.id, cashSessionId: null, method: 'bank_transfer', amountVnd: 313200, paidAt: invoice.issuedAt, reference: 'TEST', status: 'completed' }
const salon: SalonInvoiceProfile = { name: 'Salon Tóc Quyền', tagline: 'Hair artistry', address: '123 Đường Mẫu, TP.HCM', phone: '0900000000', email: 'salon@example.test', taxCode: '', bankName: 'Ngân hàng mẫu', bankAccount: '123456', aftercareNote: 'Chăm sóc theo hướng dẫn.' }

describe('salon invoice print', () => {
  it('renders customer, employee, payment, totals and salon contact details', () => {
    const html = buildInvoicePrintHtml(invoice, [payment], salon)
    expect(html).toContain('HD-TEST-001')
    expect(html).toContain('invoice-watermark')
    expect(html).toContain('M58 40 L49 27')
    expect(html).toContain('Nguyễn Mai Phương &lt;VIP&gt;')
    expect(html).toContain('Lê Thu Trang')
    expect(html).toContain('0901234567')
    expect(html).toContain('Ngân hàng mẫu')
    expect(html).toContain('313.200 ₫')
    expect(html).toContain('Chăm sóc theo hướng dẫn.')
  })
  it('escapes untrusted invoice and salon text and labels the internal print honestly', () => {
    const html = buildInvoicePrintHtml({ ...invoice, notes: '<script>alert(1)</script>' }, [], { ...salon, name: '<Salon>' })
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('Không thay thế hóa đơn điện tử hợp pháp')
  })
})
