import { salonDb } from '../db/database'

/**
 * Build a privacy-minimized, read-only snapshot for the salon assistant.
 * Never send names, phone numbers, emails, notes, formulas, invoice lines or payment references.
 */
export async function buildOwnerAssistantContext(salonId: string): Promise<string> {
  if (!salonId.trim()) throw new Error('Không xác định được salon hiện tại.')

  const [
    customers, employees, services, appointments, products, lots,
    invoices, payments, refunds, expenses,
  ] = await Promise.all([
    salonDb.customers.where('salonId').equals(salonId).toArray(),
    salonDb.employees.where('salonId').equals(salonId).toArray(),
    salonDb.services.where('salonId').equals(salonId).toArray(),
    salonDb.appointments.where('salonId').equals(salonId).toArray(),
    salonDb.products.where('salonId').equals(salonId).toArray(),
    salonDb.inventoryLots.where('salonId').equals(salonId).toArray(),
    salonDb.invoices.where('salonId').equals(salonId).toArray(),
    salonDb.payments.where('salonId').equals(salonId).toArray(),
    salonDb.refunds.where('salonId').equals(salonId).toArray(),
    salonDb.expenses.where('salonId').equals(salonId).toArray(),
  ])

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const inRange = (value: string, start: Date, end: Date) => {
    const time = Date.parse(value)
    return Number.isFinite(time) && time >= start.getTime() && time < end.getTime()
  }

  const todayAppointments = appointments.filter(item => inRange(item.startAt, today, tomorrow))
  const nextSevenDays = appointments.filter(item => inRange(item.startAt, today, weekEnd))
  const activeEmployees = employees.filter(item => item.status === 'active')
  const activeProducts = products.filter(item => item.active)
  const availableLots = lots.filter(item =>
    item.status === 'active' && item.quantityRemaining > 0 &&
    (!item.expiresAt || Date.parse(item.expiresAt) >= now.getTime()),
  )
  const lowStock = activeProducts.map(product => ({
    minimum: product.minimumStock,
    available: availableLots.filter(lot => lot.productId === product.id)
      .reduce((sum, lot) => sum + lot.quantityRemaining, 0),
  })).filter(item => item.available <= item.minimum)

  const monthInvoices = invoices.filter(item => item.status !== 'void' && inRange(item.issuedAt, monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1)))
  const monthPayments = payments.filter(item => inRange(item.paidAt, monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1)) && item.status !== 'void')
  const monthRefunds = refunds.filter(item => inRange(item.refundedAt, monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1)))
  const monthExpenses = expenses.filter(item => inRange(item.paidAt, monthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1)))

  const sum = <T,>(items: T[], getValue: (item: T) => number) =>
    items.reduce((total, item) => total + getValue(item), 0)
  const currency = (value: number) => Math.round(value).toLocaleString('vi-VN') + ' VND'
  const statusCounts = todayAppointments.reduce<Record<string, number>>((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1
    return result
  }, {})

  return [
    'DỮ LIỆU TÓM TẮT SALON – CHỈ ĐỌC, KHÔNG CÓ THÔNG TIN ĐỊNH DANH CÁ NHÂN.',
    'Thời điểm tạo: ' + now.toLocaleString('vi-VN'),
    'Phạm vi: salon hiện tại trên thiết bị này (IndexedDB); không đại diện dữ liệu thiết bị khác.',
    '',
    'TỔNG QUAN:',
    '- Khách hàng: ' + customers.length,
    '- Nhân viên: ' + activeEmployees.length + ' đang hoạt động / ' + employees.length + ' tổng số',
    '- Dịch vụ đang hoạt động: ' + services.filter(item => item.active).length,
    '- Sản phẩm đang hoạt động: ' + activeProducts.length,
    '',
    'LỊCH HẸN:',
    '- Hôm nay: ' + todayAppointments.length,
    '- 7 ngày tới: ' + nextSevenDays.length,
    '- Trạng thái lịch hôm nay: ' + (Object.entries(statusCounts).map(([key, value]) => key + '=' + value).join(', ') || 'không có'),
    '',
    'KHO:',
    '- Lô tồn còn khả dụng: ' + availableLots.length,
    '- Mặt hàng bằng hoặc dưới ngưỡng tồn tối thiểu: ' + lowStock.length,
    '- Tên/mã sản phẩm và thông tin nhà cung cấp không được gửi.',
    '',
    'TÀI CHÍNH THÁNG HIỆN TẠI:',
    '- Hóa đơn phát hành: ' + monthInvoices.length,
    '- Giá trị hóa đơn: ' + currency(sum(monthInvoices, item => item.totalVnd)),
    '- Tiền đã thu: ' + currency(sum(monthPayments, item => item.amountVnd)),
    '- Tiền hoàn: ' + currency(sum(monthRefunds, item => item.amountVnd)),
    '- Chi phí đã ghi nhận: ' + currency(sum(monthExpenses, item => item.amountVnd)),
    '',
    'QUY TẮC: Đây là số liệu tổng hợp cục bộ. Nếu dữ liệu trống hoặc thiếu, hãy nêu rõ; không suy đoán. Không yêu cầu hoặc tiết lộ tên, điện thoại, email, công thức tóc, ghi chú riêng, mã thanh toán hay thông tin nhạy cảm.',
  ].join('\n')
}
