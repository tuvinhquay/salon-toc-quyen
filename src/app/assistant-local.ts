import { salonDb } from '../db/database'
import type { Appointment, Customer, Employee, Invoice, Payment, Refund, Expense, Product, InventoryLot, Service, WorkShift } from '../db/types'

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
  if (/(khach hang|khach nao|dat lich nhieu|khach quen|khach than thiet|top khach|so khach)/.test(q)) return 'customers'
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
export async function answerOwnerQuestion(salonId: string, question: string, now = new Date()): Promise<LocalAssistantResult> {
  const intent = detectAssistantIntent(question)
  const period = detectAssistantPeriod(question)
  const range = getAssistantRange(period, now)
  const snapshot = await readSnapshot(salonId)
  const data = buildSafeContext(snapshot, range, intent)
  const lines = ['**Tổng hợp ' + range.label + '**']
  if (intent === 'finance' || intent === 'overview') {
    lines.push('• Doanh thu hóa đơn đã phát hành: **' + money(data.gross) + '** (' + data.invoiceCount + ' hóa đơn, không tính hóa đơn đã hủy).')
    lines.push('• Tiền đã thu: **' + money(data.collected) + '**.')
    lines.push('• Tiền hoàn: **' + money(data.refunded) + '**.')
    lines.push('• Chi phí đã ghi nhận: **' + money(data.spent) + '**.')
    lines.push('• Thu ròng sau hoàn tiền và chi phí: **' + money(data.net) + '**.')
    lines.push('Doanh thu hóa đơn, tiền thu thực tế và thu ròng là ba chỉ số khác nhau.')
    if (normalizeAssistantText(question).includes('loi nhuan')) lines.push('Chưa thể kết luận lợi nhuận chính xác: dữ liệu hiện chưa phân bổ đầy đủ giá vốn vật tư, chi phí nhân công và hoa hồng theo dịch vụ.')
  }
  if (intent === 'appointments' || intent === 'overview') {
    lines.push('• Lịch hẹn: **' + data.appointmentCount + '**; hoàn thành ' + data.completedCount + ', đã hủy ' + data.cancelledCount + ', khách không đến ' + data.noShowCount + '.')
  }
  if (intent === 'customers' || intent === 'overview') {
    lines.push('• Khách đặt lịch nhiều nhất (không tính lịch hủy/không đến):')
    if (!data.topCustomers.length) lines.push('  Chưa có lịch đặt gắn với hồ sơ khách hàng trong khoảng thời gian này.')
    else data.topCustomers.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.label + ' – ' + row.count + ' lịch'))
  }
  if (intent === 'services' || intent === 'overview') {
    lines.push('• Dịch vụ hoàn thành nhiều nhất:')
    if (!data.topServices.length) lines.push('  Chưa có lịch hoàn thành có gắn dịch vụ.')
    else data.topServices.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.name + ' – ' + row.count + ' lượt'))
  }
  if (intent === 'inventory' || intent === 'overview') {
    lines.push('• Mặt hàng bằng hoặc dưới ngưỡng tồn tối thiểu: **' + data.lowStock.length + '**.')
    if (data.lowStock.length) data.lowStock.slice(0, 8).forEach(row => lines.push('  - ' + row.name + ': ' + row.available + ' ' + row.unit + ' (ngưỡng ' + row.minimum + ')'))
  }
  if (intent === 'staff') {
    lines.push('• Nhân viên đang hoạt động: **' + data.activeEmployeeCount + '/' + data.employeeTotal + '**.')
    if (data.topShiftEmployees.length) {
      lines.push('• Xếp theo tổng giờ ca làm đã hoàn thành (không phải doanh thu cá nhân):')
      data.topShiftEmployees.forEach((row, index) => lines.push('  ' + (index + 1) + '. ' + row.name + ' – ' + row.hours + ' giờ, ' + row.shifts + ' ca'))
    } else {
      lines.push('Chưa có ca làm hoàn thành trong khoảng thời gian này. Muốn đánh giá hiệu suất dịch vụ/doanh thu từng người, hệ thống cần ghi nhận nhân viên thực hiện trên từng dịch vụ hoặc hóa đơn.')
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
