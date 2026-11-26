import { salonDb } from '../db/database'
import type { Appointment, Customer, Employee, Invoice, Payment, Refund, Expense, Product, InventoryLot, Service, WorkShift } from '../db/types'
import { buildOwnerFinanceAnswer } from './assistant-language'

export type AssistantPeriod = 'today' | 'month' | 'quarter' | 'year'
export type AssistantIntent = 'finance' | 'staff' | 'customers' | 'services' | 'appointments' | 'inventory' | 'overview' | 'general'
type DateRange = { start: Date; end: Date; label: string }
type Snapshot = {
  invoices: Invoice[]; payments: Payment[]; refunds: Refund[]; expenses: Expense[]
  appointments: Appointment[]; customers: Customer[]; employees: Employee[]
  services: Service[]; products: Product[]; lots: InventoryLot[]; workShifts: WorkShift[]
}
export type LocalAssistantResult = { answer: string; safeContext: string; intent: AssistantIntent; period: AssistantPeriod }

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
export const normalizeAssistantText = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim()
const money = (value: number) => Math.round(value).toLocaleString('vi-VN') + ' ₫'
const sum = <T,>(rows: T[], pick: (row: T) => number) => rows.reduce((total, row) => total + pick(row), 0)

function vietnamParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day') }
}
function vietnamMidnight(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day) - 7 * 60 * 60 * 1000)
}
export function detectAssistantPeriod(question: string): AssistantPeriod {
  const q = normalizeAssistantText(question)
  if (/\b(nam nay|ca nam|trong nam|bao cao nam|tong ket nam)\b/.test(q)) return 'year'
  if (/\b(quy nay|quy hien tai|trong quy|bao cao quy)\b/.test(q)) return 'quarter'
  if (/\b(thang nay|thang hien tai|trong thang|bao cao thang)\b/.test(q)) return 'month'
  return 'today'
}
export function getAssistantRange(period: AssistantPeriod, now = new Date()): DateRange {
  const { year, month, day } = vietnamParts(now)
  if (period === 'today') return { start: vietnamMidnight(year, month, day), end: vietnamMidnight(year, month, day + 1), label: 'hôm nay' }
  if (period === 'month') return { start: vietnamMidnight(year, month, 1), end: vietnamMidnight(year, month + 1, 1), label: 'tháng ' + month + '/' + year }
  if (period === 'quarter') {
    const firstMonth = Math.floor((month - 1) / 3) * 3 + 1
    const quarter = Math.floor((month - 1) / 3) + 1
    return { start: vietnamMidnight(year, firstMonth, 1), end: vietnamMidnight(year, firstMonth + 3, 1), label: 'quý ' + quarter + '/' + year }
  }
  return { start: vietnamMidnight(year, 1, 1), end: vietnamMidnight(year + 1, 1, 1), label: 'năm ' + year }
}
function within(value: string, range: DateRange) {
  const time = Date.parse(value)
  return Number.isFinite(time) && time >= range.start.getTime() && time < range.end.getTime()
}
export function detectAssistantIntent(question: string): AssistantIntent {
  const q = normalizeAssistantText(question)
  if (/(nhan vien|nhan su|tho nao|ai lam|nang suat|hieu suat|xuat sac|lam viec tot|gioi nhat|cham chi|nhieu ca)/.test(q)) return 'staff'
  if (/(khach hang|khach nao|khach quen|khach than thiet|top khach|so khach|khach mua|mua nhieu|chi tieu|mua nhieu san pham|tong tien khach)/.test(q)) return 'customers'
  if (/(dich vu|kieu toc|mon nao pho bien|lam nhieu nhat)/.test(q)) return 'services'
  if (/(ton kho|hang ton|san pham|my pham|dau goi|thuoc nhuom|vat tu|sap het|thieu hang|tim san pham|tra cuu san pham)/.test(q)) return 'inventory'
  if (/(lich hen|cuoc hen|hen hom|lich hom|bao nhieu lich|lich lam viec)/.test(q)) return 'appointments'
  if (/(doanh thu|doanh so|tien thu|thuc thu|thu rong|thu duoc|hoan tien|chi phi|loi nhuan|tai chinh|kiem duoc|kiem bao nhieu|lam duoc bao nhieu tien|tien hom nay|hom nay thu duoc|tinh hinh lam an|tinh hinh kinh doanh|tien tiem)/.test(q)) return 'finance'
  if (/(tong quan|tinh hinh|bao cao|phan tich|hoat dong tiem|ket qua kinh doanh)/.test(q)) return 'overview'
  return 'general'
}
async function readSnapshot(salonId: string): Promise<Snapshot> {
  if (!salonId.trim()) throw new Error('Không xác định được không gian salon hiện tại.')
  const [invoices, payments, refunds, expenses, appointments, customers, employees, services, products, lots, workShifts] = await Promise.all([
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
    salonDb.workShifts.where('salonId').equals(salonId).toArray(),
  ])
  return { invoices, payments, refunds, expenses, appointments, customers, employees, services, products, lots, workShifts }
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
    productId: product.id, name: product.name, sku: product.sku, unit: product.unit,
    minimum: product.minimumStock,
    available: sum(availableLots.filter(lot => lot.productId === product.id), lot => lot.quantityRemaining),
  })).filter(row => row.available <= row.minimum)
  const gross = sum(invoices, row => row.totalVnd)
  const collected = sum(payments, row => row.amountVnd)
  const refunded = sum(refunds, row => row.amountVnd)
  const spent = sum(expenses, row => row.amountVnd)
  const customerCounts = new Map<string, { count: number; label: string }>()
  for (const appointment of booked) {
    if (!appointment.customerId) continue
    const old = customerCounts.get(appointment.customerId)
    customerCounts.set(appointment.customerId, { count: (old?.count ?? 0) + 1, label: appointment.customerNameSnapshot || 'Khách hàng' })
  }
  const topCustomers = [...customerCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  const serviceCounts = new Map<string, number>()
  for (const appointment of completed) for (const serviceId of appointment.serviceIds) serviceCounts.set(serviceId, (serviceCounts.get(serviceId) ?? 0) + 1)
  const topServices = [...serviceCounts.entries()].map(([id, count]) => ({ name: snapshot.services.find(service => service.id === id)?.name ?? 'Dịch vụ không còn trong danh mục', count })).sort((a, b) => b.count - a.count).slice(0, 5)
  const shiftTotals = new Map<string, { shifts: number; hours: number }>()
  for (const shift of snapshot.workShifts.filter(row => row.status === 'completed' && within(row.startAt, range))) {
    const duration = Math.max(0, Date.parse(shift.endAt) - Date.parse(shift.startAt)) / 3_600_000
    const old = shiftTotals.get(shift.employeeId) ?? { shifts: 0, hours: 0 }
    shiftTotals.set(shift.employeeId, { shifts: old.shifts + 1, hours: old.hours + duration })
  }
  const topShiftEmployees = [...shiftTotals.entries()].map(([id, value]) => ({
    name: snapshot.employees.find(employee => employee.id === id)?.fullName ?? 'Nhân viên không còn trong danh sách',
    shifts: value.shifts, hours: Math.round(value.hours * 10) / 10,
  })).sort((a, b) => b.hours - a.hours || b.shifts - a.shifts).slice(0, 5)
  return {
    gross, collected, refunded, spent, net: collected - refunded - spent,
    invoiceCount: invoices.length, paymentCount: payments.length, refundCount: refunds.length,
    appointmentCount: appointments.length, completedCount: completed.length,
    cancelledCount: appointments.filter(row => row.status === 'cancelled').length,
    noShowCount: appointments.filter(row => row.status === 'no_show').length,
    activeEmployeeCount: activeEmployees.length, employeeTotal: snapshot.employees.length,
    topCustomers, topServices, lowStock, topShiftEmployees,
    period: range.label, intent,
  }
}
function productLookup(snapshot: Snapshot, question: string): string | null {
  const q = normalizeAssistantText(question)
  const terms = q.split(' ').filter(token => token.length > 2 && !['tim','tra','cuu','san','pham','gi','nao','co','cho','toi','minh','ban','loai'].includes(token))
  const matches = snapshot.products.filter(product => product.active).map(product => {
    const haystack = normalizeAssistantText([product.name, product.sku ?? '', product.category].join(' '))
    return { product, score: terms.filter(term => haystack.includes(term)).length }
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8)
  if (!matches.length && !/(san pham|my pham|dau goi|thuoc nhuom|ton kho|mat hang)/.test(q)) return null
  if (!matches.length) return 'Mình chưa tìm thấy sản phẩm khớp trong danh mục của salon. Bạn có thể thêm tên sản phẩm hoặc mã SKU vào kho để mình tra cứu.'
  return 'Các sản phẩm phù hợp trong danh mục salon:\n' + matches.map(({ product }) => {
    const quantity = snapshot.lots.filter(lot => lot.productId === product.id && lot.status === 'active' && (!lot.expiresAt || Date.parse(lot.expiresAt) > Date.now())).reduce((total, lot) => total + lot.quantityRemaining, 0)
    return '• ' + product.name + (product.sku ? ' · SKU ' + product.sku : '') + ' · ' + quantity + ' ' + product.unit + ' còn khả dụng · Ngưỡng tối thiểu ' + product.minimumStock
  }).join('\n')
}
const CUSTOMER_LOOKUP_STOP_WORDS = new Set(['tim','tra','cuu','thong','tin','ho','so','chi','tiet','khach','hang','khachhang','ten','sdt','so','dien','thoai','giup','minh','toi','ban','cho','em','anh','chi','co','la','nao','nhe','nha'])

export function isCustomerLookupRequest(question: string): boolean {
  const q = normalizeAssistantText(question)
  if (/(chi tieu nhieu nhat|mua nhieu nhat|dat lich nhieu nhat|top khach|khach hang nao|khach nao|xep hang khach)/.test(q)) return false
  return /(tim khach|tra cuu khach|thong tin khach|ho so khach|chi tiet khach|khach hang [a-z])/.test(q)
}

export function findCustomerLookupMatches(customers: Customer[], question: string): Customer[] {
  const q = normalizeAssistantText(question)
  const active = customers.filter(customer => !customer.archivedAt)
  const direct = active.filter(customer => {
    const name = normalizeAssistantText(customer.fullName)
    return name.length > 2 && q.includes(name)
  })
  if (direct.length) return direct.sort((a, b) => normalizeAssistantText(b.fullName).length - normalizeAssistantText(a.fullName).length)

  const digits = question.replace(/\D/g, '')
  if (digits.length >= 6) {
    const byPhone = active.filter(customer => (customer.phone ?? '').replace(/\D/g, '').includes(digits))
    if (byPhone.length) return byPhone
  }

  if (!isCustomerLookupRequest(question)) return []

  const tokens = [...new Set(q.split(' ').filter(token => token.length > 1 && !CUSTOMER_LOOKUP_STOP_WORDS.has(token)))]
  if (!tokens.length) return []
  const matches = active.map(customer => {
    const name = normalizeAssistantText(customer.fullName)
    const phone = (customer.phone ?? '').replace(/\D/g, '')
    const matched = tokens.filter(token => name.includes(token)).length
    return { customer, score: matched / tokens.length, matched, phoneMatch: digits.length >= 6 && phone.includes(digits) }
  }).filter(item => item.phoneMatch || (item.matched > 0 && item.score >= 0.6))
    .sort((a, b) => Number(b.phoneMatch) - Number(a.phoneMatch) || b.score - a.score || a.customer.fullName.localeCompare(b.customer.fullName, 'vi'))
  return matches.slice(0, 8).map(item => item.customer)
}

function customerProfileLookup(snapshot: Snapshot, question: string): string | null {
  const matches = findCustomerLookupMatches(snapshot.customers, question)
  if (!matches.length) {
    if (isCustomerLookupRequest(question)) return 'Mình chưa tìm thấy khách hàng khớp với thông tin bạn nhập. Bạn hãy thử nhập tên đầy đủ hoặc số điện thoại trong hồ sơ khách hàng.'
    return null
  }
  if (matches.length > 1) return 'Mình tìm thấy nhiều khách hàng phù hợp, bạn chọn đúng hồ sơ nhé:\\n' + matches.map((customer, index) => (index + 1) + '. ' + customer.fullName + (customer.phone ? ' · ' + customer.phone : '')).join('\n')
  const customer = matches[0]
  const invoices = snapshot.invoices.filter(invoice => invoice.status !== 'void' && invoice.customerId === customer.id)
  const totalSpend = sum(invoices, invoice => invoice.totalVnd)
  const appointments = snapshot.appointments.filter(item => item.customerId === customer.id)
  const validAppointments = appointments.filter(item => item.status !== 'cancelled' && item.status !== 'no_show')
  const lastAppointment = validAppointments.sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))[0]
  return [
    '**Khách hàng: ' + customer.fullName + '**',
    '• Số điện thoại: ' + (customer.phone || 'Chưa cập nhật'),
    '• Email: ' + (customer.email || 'Chưa cập nhật'),
    '• Lịch hẹn hợp lệ: ' + validAppointments.length + ' (' + appointments.filter(item => item.status === 'completed').length + ' đã hoàn thành)',
    '• Hóa đơn đã phát hành: ' + invoices.length,
    '• Tổng chi tiêu theo hóa đơn: ' + money(totalSpend),
    '• Lịch gần nhất: ' + (lastAppointment ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE }).format(new Date(lastAppointment.startAt)) + ' · ' + lastAppointment.status : 'Chưa có lịch hẹn'),
  ].join('\n')
}

function staffProfileLookup(snapshot: Snapshot, question: string): string | null {
  const q = normalizeAssistantText(question)
  const digits = question.replace(/\D/g, '')
  const candidates = snapshot.employees.filter(employee => {
    const name = normalizeAssistantText(employee.fullName)
    const phone = (employee.phone ?? '').replace(/\D/g, '')
    return (name.length > 2 && q.includes(name)) || (digits.length >= 8 && phone.length >= 8 && phone.includes(digits))
  })
  if (candidates.length !== 1) return null
  const employee = candidates[0]
  const completed = snapshot.workShifts.filter(shift => shift.employeeId === employee.id && shift.status === 'completed')
  const totalHours = completed.reduce((total, shift) => total + Math.max(0, Date.parse(shift.endAt) - Date.parse(shift.startAt)) / 3600000, 0)
  const periodRange = getAssistantRange(detectAssistantPeriod(question))
  const current = completed.filter(shift => within(shift.startAt, periodRange))
  const attributed = snapshot.invoices.filter(invoice => invoice.status !== 'void').flatMap(invoice => invoice.lines.filter(line => line.employeeId === employee.id).map(line => ({ invoice, line })))
  const periodAttributed = attributed.filter(row => within(row.invoice.issuedAt, periodRange))
  const serviceRevenue = attributed.filter(row => row.line.lineType === 'service').reduce((sum, row) => sum + row.line.totalVnd, 0)
  const productRevenue = attributed.filter(row => row.line.lineType === 'product').reduce((sum, row) => sum + row.line.totalVnd, 0)
  const productQuantity = attributed.filter(row => row.line.lineType === 'product').reduce((sum, row) => sum + row.line.quantity, 0)
  const attributedCustomers = new Set(attributed.map(row => row.invoice.customerId).filter((id): id is string => Boolean(id)))
  const periodRevenue = periodAttributed.reduce((sum, row) => sum + row.line.totalVnd, 0)
  const periodCustomers = new Set(periodAttributed.map(row => row.invoice.customerId).filter((id): id is string => Boolean(id)))
  const joined = new Date(employee.joinedAt)
  const today = new Date()
  const months = Number.isFinite(joined.getTime()) ? Math.max(0, (today.getFullYear() - joined.getFullYear()) * 12 + today.getMonth() - joined.getMonth() - (today.getDate() < joined.getDate() ? 1 : 0)) : null
  const tenure = months === null ? 'chưa có ngày hợp lệ' : months < 12 ? months + ' tháng' : Math.floor(months / 12) + ' năm ' + (months % 12) + ' tháng'
  return [
    '**Hồ sơ nhân viên: ' + employee.fullName + '**',
    '• Số điện thoại: ' + (employee.phone ?? 'Chưa cập nhật') + '.',
    '• Email: ' + (employee.email ?? 'Chưa cập nhật') + '.',
    '• Vị trí: ' + ({ manager: 'Quản lý', stylist: 'Nhà tạo mẫu', assistant: 'Trợ lý salon', cashier: 'Thu ngân' }[employee.role] ?? employee.role) + ' · Trạng thái: ' + (employee.status === 'active' ? 'Đang làm việc' : 'Đã ngừng hoạt động') + '.',
    '• Ngày vào làm: ' + new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(joined) + ' · Thâm niên ước tính: ' + tenure + '.',
    '• Tổng ca đã hoàn thành: ' + completed.length + ' · Tổng giờ ca ghi nhận: ' + Math.round(totalHours * 10) / 10 + ' giờ.',
    '• Trong ' + periodRange.label + ': ' + current.length + ' ca hoàn thành.',
    '• Doanh số gộp trên các dòng hóa đơn được gán cho nhân viên: ' + money(serviceRevenue + productRevenue) + ' (dịch vụ ' + money(serviceRevenue) + ', sản phẩm ' + money(productRevenue) + ').',
    '• Khách hàng có hóa đơn được gán: ' + attributedCustomers.size + ' · Sản phẩm đã bán: ' + productQuantity + '.',
    '• Trong ' + periodRange.label + ': doanh số gộp được gán ' + money(periodRevenue) + ' · ' + periodCustomers.size + ' khách hàng có hóa đơn · ' + periodAttributed.length + ' dòng hàng.',
    '• Thành tích xác minh được: ' + (completed.length ? completed.length + ' ca làm và ' + (Math.round(totalHours * 10) / 10) + ' giờ đã hoàn thành.' : 'Chưa có ca làm hoàn thành được ghi nhận.') + (attributed.length ? ' Có thêm ' + money(serviceRevenue + productRevenue) + ' doanh thu được gán qua hóa đơn.' : ' Chưa có dòng hóa đơn nào được gán cho nhân viên.'),
    'Lưu ý: doanh số gộp chỉ tính từ ngày hóa đơn bắt đầu được gán nhân viên; hóa đơn lịch sử chưa có phân công không được suy đoán. Tiền hoàn chưa được phân bổ ngược về từng nhân viên.'
  ].join('\n')
}

export async function answerOwnerQuestion(salonId: string, question: string, now = new Date()): Promise<LocalAssistantResult> {
  const intent = detectAssistantIntent(question)
  const period = detectAssistantPeriod(question)
  const range = getAssistantRange(period, now)
  const snapshot = await readSnapshot(salonId)
  const data = buildSafeContext(snapshot, range, intent)
  if (intent === 'staff') {
    const profile = staffProfileLookup(snapshot, question)
    if (profile) return { answer: profile, safeContext: 'Hồ sơ, ca làm và các dòng hóa đơn được gán nhân viên trong salon hiện tại.', intent, period }
    const normalizedQuestion = normalizeAssistantText(question)
    const rankingRequest = /(nhan vien nao|top nhan vien|nhan vien .* nhat|nang suat|hieu suat|nhieu ca)/.test(normalizedQuestion)
    const detailRequest = (!rankingRequest && /(tim nhan vien|tra cuu nhan vien|thong tin nhan vien|ho so nhan vien|chi tiet nhan vien|nhan vien [a-z])/.test(normalizedQuestion)) || question.replace(/\D/g, '').length >= 8
    if (detailRequest) return { answer: 'Em chưa tìm thấy một hồ sơ nhân viên khớp duy nhất với tên hoặc số điện thoại anh cung cấp. Anh kiểm tra lại chính tả hoặc số điện thoại trong mục Nhân viên giúp em nhé. Em không tự chọn hồ sơ gần giống để tránh nhầm người.', safeContext: 'Không tìm thấy kết quả hồ sơ nhân viên duy nhất trong salon hiện tại.', intent, period }
  }
  const asksProfit = normalizeAssistantText(question).includes('loi nhuan')
  const lines = intent === 'finance' || intent === 'overview'
    ? buildOwnerFinanceAnswer(range.label, { grossInvoiceVnd: data.gross, invoiceCount: data.invoiceCount, collectedVnd: data.collected, refundedVnd: data.refunded, expensesVnd: data.spent, remainingVnd: data.net }, asksProfit)
    : ['**Tình hình tiệm trong ' + range.label + '**']
  if (intent === 'appointments' || intent === 'overview') {
    lines.push('• Lịch hẹn: **' + data.appointmentCount + '**; hoàn thành ' + data.completedCount + ', đã hủy ' + data.cancelledCount + ', khách không đến ' + data.noShowCount + '.')
  }
  const customerLookup = customerProfileLookup(snapshot, question)
  if (customerLookup) return { answer: customerLookup, safeContext: 'Tra cứu hồ sơ khách hàng và số liệu hóa đơn/lịch hẹn từ salon hiện tại; chỉ đọc.', intent, period }

  if (intent === 'customers') {
    const q = normalizeAssistantText(question)
    const customerInvoices = snapshot.invoices.filter(row => row.status !== 'void' && row.customerId && within(row.issuedAt, range))
    const spendByCustomer = new Map<string, { name: string; amount: number; invoices: number; products: number }>()
    for (const invoice of customerInvoices) {
      const current = spendByCustomer.get(invoice.customerId!) ?? { name: invoice.customerNameSnapshot, amount: 0, invoices: 0, products: 0 }
      current.amount += invoice.totalVnd
      current.invoices += 1
      current.products += invoice.lines.filter(line => line.lineType === 'product').reduce((total, line) => total + line.quantity, 0)
      spendByCustomer.set(invoice.customerId!, current)
    }
    const rankByProductCount = /(mua nhieu san pham|so luong san pham|mua nhieu mon|so san pham nhieu nhat)/.test(q)
    const rankByAppointments = /(dat lich|lich hen|hen nhieu|quay lai nhieu|so lan den|tan suat den)/.test(q)
    const rankBySpend = /(chi tieu|tieu nhieu|tong tien|gia tri hoa don|mua hang nhieu tien|doanh so khach)/.test(q)
    const metricCount = Number(rankByProductCount) + Number(rankByAppointments) + Number(rankBySpend)
    if (metricCount > 1) {
      lines.push('Bạn muốn xếp hạng theo một tiêu chí nào: số lịch hẹn, tổng chi tiêu hóa đơn hay số lượng sản phẩm mua?')
    } else if (metricCount === 0) {
      lines.push('Bạn muốn tìm khách theo tên/số điện thoại, hay xếp hạng theo chi tiêu, số lịch hẹn hoặc số lượng sản phẩm mua?')
    } else if (rankByAppointments) {
      const counts = new Map<string, { name: string; count: number }>()
      for (const appointment of snapshot.appointments.filter(row => within(row.startAt, range) && row.status !== 'cancelled' && row.status !== 'no_show' && row.customerId)) {
        const current = counts.get(appointment.customerId!) ?? { name: appointment.customerNameSnapshot, count: 0 }
        current.count += 1
        counts.set(appointment.customerId!, current)
      }
      const ranked = [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi')).slice(0, 5)
      lines.push('**Khách đặt lịch nhiều nhất trong ' + range.label + '**')
      if (!ranked.length) lines.push('Chưa có lịch hẹn hợp lệ gắn với khách hàng trong kỳ.')
      else ranked.forEach((row, index) => lines.push((index + 1) + '. ' + row.name + ' — ' + row.count + ' lịch'))
    } else {
      const ranked = [...spendByCustomer.values()].sort((a, b) => rankByProductCount ? b.products - a.products || b.amount - a.amount : b.amount - a.amount).slice(0, 5)
      lines.push(rankByProductCount ? '**Khách mua nhiều sản phẩm nhất theo số lượng trong ' + range.label + '**' : '**Khách chi tiêu nhiều nhất trong ' + range.label + '**')
      if (!ranked.length) lines.push('Chưa có hóa đơn hợp lệ gắn với khách hàng trong kỳ.')
      else ranked.forEach((row, index) => lines.push((index + 1) + '. ' + row.name + ' — ' + (rankByProductCount ? row.products + ' sản phẩm' : money(row.amount)) + ' · ' + row.invoices + ' hóa đơn'))
    }
  }
  if (intent === 'services' || intent === 'overview') {
    lines.push('• Dịch vụ hoàn thành nhiều nhất:')
    if (!data.topServices.length) lines.push('  Chưa có lịch hoàn thành có gắn dịch vụ.')
    else data.topServices.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.name + ' – ' + row.count + ' lượt'))
  }
  if (intent === 'inventory' || intent === 'overview') {
    lines.push('• Mặt hàng còn ít hơn mức tồn cần có: **' + data.lowStock.length + '**.')
    if (data.lowStock.length) data.lowStock.slice(0, 8).forEach(row => lines.push('  - ' + row.name + ': ' + row.available + ' ' + row.unit + ' (mức cần có ' + row.minimum + ')'))
  }
  if (intent === 'staff') {
    lines.push('• Nhân viên đang hoạt động: **' + data.activeEmployeeCount + '/' + data.employeeTotal + '**.')
    if (data.topShiftEmployees.length) {
      lines.push('• Xếp theo tổng số giờ làm của các ca đã hoàn thành (không phải số tiền mỗi người mang về cho tiệm):')
      data.topShiftEmployees.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.name + ' – ' + row.hours + ' giờ, ' + row.shifts + ' ca'))
    } else {
      lines.push('Chưa có ca làm hoàn thành trong khoảng thời gian này. Muốn biết doanh thu từng người, tiệm cần ghi lại ai là người thực hiện từng dịch vụ hoặc hóa đơn.')
    }
  }
  if (intent === 'general') {
    lines.push('Mình có thể tra cứu doanh thu, tiền thu, hoàn tiền, chi phí, lịch hẹn, khách hàng, dịch vụ, nhân viên, tồn kho và sản phẩm. Bạn có thể hỏi tự nhiên, ví dụ “Quý này tiệm làm ăn thế nào?”')
  }
  const safeContext = [
    'Số liệu được tính bằng bộ máy nghiệp vụ cục bộ, chỉ đọc, giới hạn salonId đã xác thực.',
    'VND: grossInvoiceRevenue=' + data.gross + '; collected=' + data.collected + '; refunds=' + data.refunded + '; expenses=' + data.spent + '; netCollectedAfterRefundsAndExpenses=' + data.net + '.',
    'Counts: invoices=' + data.invoiceCount + '; appointments=' + data.appointmentCount + '; completedAppointments=' + data.completedCount + '; activeEmployees=' + data.activeEmployeeCount + '; lowStockItems=' + data.lowStock.length + '.',
    'Employee shift ranking is based only on completed shift hours, not attributed service revenue.',
    'Period=' + data.period + '; intent=' + intent + '.',
  ].join('\n')
  const productAnswer = intent === 'inventory' ? productLookup(snapshot, question) : null
  return { answer: productAnswer && /tim|tra cuu|san pham|dau goi|thuoc nhuom/.test(normalizeAssistantText(question)) ? productAnswer : lines.join('\n'), safeContext, intent, period }
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
    .filter(name => name.trim().length >= 2).sort((a, b) => b.length - a.length)
  for (const name of names) safe = safe.split(name.toLocaleLowerCase('vi')).join('[tên đã ẩn]')
  return safe.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}/gi, '[email đã ẩn]').replace(/(?:[+]?[0-9]{1,3})?(?:[ .-]*[0-9]){9,11}/g, '[số điện thoại đã ẩn]').slice(0, 1200)
}
