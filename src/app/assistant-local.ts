import { salonDb } from '../db/database'
import type { Appointment, Customer, Employee, Invoice, Payment, Refund, Expense, Product, InventoryLot, Service } from '../db/types'

export type AssistantPeriod = 'today' | 'month' | 'year'
export type AssistantIntent = 'finance' | 'staff' | 'customers' | 'services' | 'appointments' | 'inventory' | 'overview' | 'general'
type DateRange = { start: Date; end: Date; label: string }
type Snapshot = {
  invoices: Invoice[]; payments: Payment[]; refunds: Refund[]; expenses: Expense[]
  appointments: Appointment[]; customers: Customer[]; employees: Employee[]
  services: Service[]; products: Product[]; lots: InventoryLot[]
}
export type LocalAssistantResult = { answer: string; safeContext: string; intent: AssistantIntent; period: AssistantPeriod }

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const money = (value: number) => Math.round(value).toLocaleString('vi-VN') + ' ₫'
const sum = <T,>(rows: T[], pick: (row: T) => number) => rows.reduce((total, row) => total + pick(row), 0)

function vietnamParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}
function vietnamMidnight(year: number, month: number, day: number) {
  // Vietnam uses UTC+07:00; convert local calendar midnight to an absolute timestamp.
  return new Date(Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000)
}
export function detectAssistantPeriod(question: string): AssistantPeriod {
  const q = normalize(question)
  if (q.includes('nam nay') || q.includes('ca nam') || q.includes('trong nam')) return 'year'
  if (q.includes('thang nay') || q.includes('thang hien tai')) return 'month'
  return 'today'
}
export function getAssistantRange(period: AssistantPeriod, now = new Date()): DateRange {
  const { year, month, day } = vietnamParts(now)
  if (period === 'today') return { start: vietnamMidnight(year, month, day), end: vietnamMidnight(year, month, day + 1), label: 'hôm nay' }
  if (period === 'month') return { start: vietnamMidnight(year, month, 1), end: vietnamMidnight(year, month + 1, 1), label: 'tháng ' + month + '/' + year }
  return { start: vietnamMidnight(year, 1, 1), end: vietnamMidnight(year + 1, 1, 1), label: 'năm ' + year }
}
function within(value: string, range: DateRange) {
  const time = Date.parse(value)
  return Number.isFinite(time) && time >= range.start.getTime() && time < range.end.getTime()
}
export function detectAssistantIntent(question: string): AssistantIntent {
  const q = normalize(question)
  if (/(nhan vien|nhan su|tho nao|ai lam|nang suat|hieu suat)/.test(q)) return 'staff'
  if (/(khach hang|khach nao|dat lich nhieu|khach quen|khach than thiet)/.test(q)) return 'customers'
  if (/(dich vu|kieu toc|mon nao pho bien)/.test(q)) return 'services'
  if (/(ton kho|hang ton|san pham|vat tu|sap het|thieu hang)/.test(q)) return 'inventory'
  if (/(lich hen|cuoc hen|hen hom|lich hom|bao nhieu lich)/.test(q)) return 'appointments'
  if (/(doanh thu|tien thu|thuc thu|thu duoc|hoan tien|chi phi|loi nhuan|tai chinh|kiem duoc|kiem bao nhieu|lam duoc bao nhieu tien|tien hom nay|hom nay thu duoc)/.test(q)) return 'finance'
  if (/(tong quan|tinh hinh|bao cao|phân tich|phan tich)/.test(q)) return 'overview'
  return 'general'
}
async function readSnapshot(salonId: string): Promise<Snapshot> {
  if (!salonId.trim()) throw new Error('Không xác định được salon hiện tại.')
  const [invoices, payments, refunds, expenses, appointments, customers, employees, services, products, lots] = await Promise.all([
    salonDb.invoices.where('salonId').equals(salonId).toArray(),
    salonDb.payments.where('salonId').equals(salonId).toArray(),
    salonDb.refunds.where('salonId').equals(salonId).toArray(),
    salonDb.expenses.where('salonId').equals(salonId).toArray(),
    salonDb.appointments.where('salonId').equals(salonId).toArray(),
    salonDb.customers.where('salonId').equals(salonId).toArray(),
    salonDb.employees.where('salonId').equals(salonId).toArray(),
    salonDb.services.where('salonId').equals(salonId).toArray(),
    salonDb.products.where('salonId').equals(salonId).toArray(),
    salonDb.inventoryLots.where('salonId').equals(salonId).toArray(),
  ])
  return { invoices, payments, refunds, expenses, appointments, customers, employees, services, products, lots }
}
function buildSafeContext(snapshot: Snapshot, range: DateRange, intent: AssistantIntent) {
  const invoices = snapshot.invoices.filter(row => row.status !== 'void' && within(row.issuedAt, range))
  const payments = snapshot.payments.filter(row => row.status !== 'void' && within(row.paidAt, range))
  const refunds = snapshot.refunds.filter(row => within(row.refundedAt, range))
  const expenses = snapshot.expenses.filter(row => within(row.paidAt, range))
  const appointments = snapshot.appointments.filter(row => within(row.startAt, range))
  const completed = appointments.filter(row => row.status === 'completed')
  const booked = appointments.filter(row => row.status !== 'cancelled' && row.status !== 'no_show')
  const activeEmployees = snapshot.employees.filter(row => row.status === 'active')
  const availableLots = snapshot.lots.filter(row => row.status === 'active' && row.quantityRemaining > 0 && (!row.expiresAt || Date.parse(row.expiresAt) >= Date.now()))
  const lowStock = snapshot.products.filter(row => row.active).map(product => ({
    productId: product.id,
    minimum: product.minimumStock,
    available: sum(availableLots.filter(lot => lot.productId === product.id), lot => lot.quantityRemaining),
  })).filter(row => row.available <= row.minimum)
  const gross = sum(invoices, row => row.totalVnd)
  const collected = sum(payments, row => row.amountVnd)
  const refunded = sum(refunds, row => row.amountVnd)
  const spent = sum(expenses, row => row.amountVnd)
  const customerCounts = new Map<string, { count: number; label: string }>()
  for (const appointment of completed) {
    if (!appointment.customerId) continue
    const old = customerCounts.get(appointment.customerId)
    customerCounts.set(appointment.customerId, { count: (old?.count ?? 0) + 1, label: appointment.customerNameSnapshot || 'Khách hàng' })
  }
  const topCustomers = [...customerCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  const serviceCounts = new Map<string, number>()
  for (const appointment of completed) for (const serviceId of appointment.serviceIds) serviceCounts.set(serviceId, (serviceCounts.get(serviceId) ?? 0) + 1)
  const topServices = [...serviceCounts.entries()].map(([id, count]) => ({ name: snapshot.services.find(service => service.id === id)?.name ?? 'Dịch vụ không còn trong danh mục', count })).sort((a, b) => b.count - a.count).slice(0, 5)
  return {
    gross, collected, refunded, spent, net: collected - refunded - spent,
    invoiceCount: invoices.length, paymentCount: payments.length, refundCount: refunds.length,
    appointmentCount: appointments.length, completedCount: completed.length,
    cancelledCount: appointments.filter(row => row.status === 'cancelled').length,
    noShowCount: appointments.filter(row => row.status === 'no_show').length,
    activeEmployeeCount: activeEmployees.length, employeeTotal: snapshot.employees.length,
    topCustomers, topServices, lowStockCount: lowStock.length,
    lowStockItems: lowStock.map(row => ({ available: row.available, minimum: row.minimum })),
    // Employee attribution is not present in Appointment/Invoice records yet; never infer individual performance.
    staffAttributionAvailable: false,
    period: range.label, intent,
  }
}
export async function answerOwnerQuestion(salonId: string, question: string, now = new Date()): Promise<LocalAssistantResult> {
  const intent = detectAssistantIntent(question)
  const period = detectAssistantPeriod(question)
  const range = getAssistantRange(period, now)
  const snapshot = await readSnapshot(salonId)
  const data = buildSafeContext(snapshot, range, intent)
  const lines = ['**Báo cáo ' + range.label + '**']
  if (intent === 'finance' || intent === 'overview') {
    lines.push('• Doanh thu hóa đơn đã phát hành: **' + money(data.gross) + '** (' + data.invoiceCount + ' hóa đơn, không tính hóa đơn đã hủy).')
    lines.push('• Tiền đã thu: **' + money(data.collected) + '**.')
    lines.push('• Tiền hoàn: **' + money(data.refunded) + '**.')
    lines.push('• Chi phí đã ghi nhận: **' + money(data.spent) + '**.')
    lines.push('• Thu ròng sau hoàn tiền và chi phí: **' + money(data.net) + '**.')
    lines.push('Lưu ý: doanh thu hóa đơn, tiền thu thực tế và thu ròng là ba chỉ số khác nhau.')\n    if (normalize(question).includes('loi nhuan')) lines.push('Chưa thể kết luận lợi nhuận chính xác: dữ liệu hiện chưa phân bổ đầy đủ giá vốn vật tư, chi phí nhân công và hoa hồng theo dịch vụ.')
  }
  if (intent === 'appointments' || intent === 'overview') {
    lines.push('• Lịch hẹn: **' + data.appointmentCount + '**; hoàn thành ' + data.completedCount + ', đã hủy ' + data.cancelledCount + ', khách không đến ' + data.noShowCount + '.')
  }
  if (intent === 'customers' || intent === 'overview') {
    lines.push('• Top khách đặt lịch (loại lịch đã hủy/không đến):')
    if (!data.topCustomers.length) lines.push('  Chưa có lịch đặt gắn với hồ sơ khách hàng trong khoảng thời gian này.')
    else data.topCustomers.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.label + ' – ' + row.count + ' lịch hoàn thành'))
  }
  if (intent === 'services' || intent === 'overview') {
    lines.push('• Dịch vụ được thực hiện nhiều nhất:')
    if (!data.topServices.length) lines.push('  Chưa có lịch hoàn thành có gắn dịch vụ.')
    else data.topServices.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.name + ' – ' + row.count + ' lượt'))
  }
  if (intent === 'inventory' || intent === 'overview') lines.push('• Mặt hàng bằng hoặc dưới ngưỡng tồn tối thiểu: **' + data.lowStockCount + '**.')
  if (intent === 'staff') {
    lines.push('• Nhân viên đang hoạt động: **' + data.activeEmployeeCount + '/' + data.employeeTotal + '**.')
    lines.push('Chưa thể xếp hạng ai làm nhiều nhất một cách chính xác: lịch hẹn và hóa đơn hiện chưa lưu mã nhân viên thực hiện. Bot sẽ không tự suy đoán hoặc gán doanh thu cho nhân viên.')
  }
  if (intent === 'general') {
    lines.push('Mình chưa nhận diện chắc loại câu hỏi. Bạn có thể hỏi về doanh thu, lịch hẹn, khách hàng đặt lịch nhiều, dịch vụ phổ biến, nhân viên hoặc tồn kho.')
  }
  lines.push('', '_Dữ liệu lấy từ IndexedDB trên thiết bị hiện tại, giới hạn theo salon đã đăng nhập. Đây không phải dữ liệu đồng bộ từ thiết bị khác._')
  const safeContext = [
    'Dữ liệu phân tích đã được tính bằng mã nghiệp vụ, không yêu cầu mô hình tự tính tiền.',
    'Chỉ số VND: grossInvoiceRevenue=' + data.gross + '; collected=' + data.collected + '; refunds=' + data.refunded + '; expenses=' + data.spent + '; netCollectedAfterRefundsAndExpenses=' + data.net + '.',
    'Số liệu: invoices=' + data.invoiceCount + '; appointments=' + data.appointmentCount + '; completedAppointments=' + data.completedCount + '; activeEmployees=' + data.activeEmployeeCount + '; lowStockItems=' + data.lowStockCount + '.',
    'Employee performance attribution available=' + data.staffAttributionAvailable + '. Không có employeeId trên bản ghi lịch hẹn/hóa đơn hiện tại.',
    'Customer/service ranking is computed locally. Do not infer employee rankings, profit, or missing facts.',
    'Period=' + data.period + '; intent=' + intent + '.',
  ].join('\n')
  return { answer: lines.join('\n'), safeContext, intent, period }
}

/** Redact known local customer/employee names and contact details before an optional Gemini request. */
export async function redactQuestionForGemini(salonId: string, question: string): Promise<string> {
  const [customers, employees, appointments] = await Promise.all([
    salonDb.customers.where('salonId').equals(salonId).toArray(),
    salonDb.employees.where('salonId').equals(salonId).toArray(),
    salonDb.appointments.where('salonId').equals(salonId).toArray(),
  ])
  let safe = question.toLocaleLowerCase('vi')
  const names = [...customers.map(row => row.fullName), ...employees.map(row => row.fullName), ...appointments.map(row => row.customerNameSnapshot)]
    .filter(name => name.trim().length >= 2)
    .sort((a, b) => b.length - a.length)
  for (const name of names) {
    safe = safe.split(name.toLocaleLowerCase('vi')).join('[tên đã ẩn]')
  }
  return safe
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}/gi, '[email đã ẩn]')
    .replace(/(?:[+]?[0-9]{1,3})?(?:[ .-]*[0-9]){9,11}/g, '[số điện thoại đã ẩn]')
    .slice(0, 1200)
}
