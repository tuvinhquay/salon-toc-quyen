import { salonDb } from './database'
import type { ActorContext, Appointment, AuditEvent, CashSession, CommissionPolicy, Customer, CustomerGroup, Employee, Expense, Invoice, InventoryLot, Payment, Product, PurchaseOrder, Refund, Service, StockMovement, Supplier, TaxPolicy, WorkShift } from './types'

const prefixFor = (salonId: string) => 'demo_' + salonId + '_'
const DAY = 24 * 60 * 60 * 1000
const money = (value: number) => Math.round(value)
const iso = (date: Date) => date.toISOString()
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY)
const localDate = (year: number, month: number, day: number, hour = 9) => new Date(year, month, day, hour, 0, 0, 0)
const monthLabel = (date: Date) => date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0')
const mondayOf = (date: Date) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8)
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7))
  return result
}
export function getFiveMonthDemoPeriod(now = new Date()) {
  return {
    startAt: iso(new Date(now.getFullYear(), now.getMonth() - 4, 1, 8)),
    endAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)),
  }
}

const makeRandom = (seed: string) => {
  let state = 2166136261
  for (let i = 0; i < seed.length; i += 1) state = Math.imul(state ^ seed.charCodeAt(i), 16777619)
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export type DemoCounts = Record<string, number>
const demoTables = [
  salonDb.customers, salonDb.customerGroups, salonDb.appointments, salonDb.services,
  salonDb.employees, salonDb.workShifts, salonDb.commissionPolicies, salonDb.products,
  salonDb.suppliers, salonDb.purchaseOrders, salonDb.inventoryLots, salonDb.stockMovements,
  salonDb.invoices, salonDb.payments, salonDb.refunds, salonDb.cashSessions,
  salonDb.expenses, salonDb.taxPolicies, salonDb.auditEvents,
] as const

export async function getDemoDataCounts(salonId: string): Promise<DemoCounts> {
  const prefix = prefixFor(salonId)
  const entries = await Promise.all(demoTables.map(async table => {
    const rows = await table.where('salonId').equals(salonId).toArray()
    return [table.name, rows.filter(row => row.id.startsWith(prefix)).length] as const
  }))
  return Object.fromEntries(entries)
}

type PendingUse = { productIndex: number; quantity: number; occurredAt: string; sourceId: string; monthKey: string }
type DemoBundle = {
  customers: Customer[]; groups: CustomerGroup[]; appointments: Appointment[]; services: Service[];
  employees: Employee[]; shifts: WorkShift[]; commissions: CommissionPolicy[]; products: Product[];
  suppliers: Supplier[]; orders: PurchaseOrder[]; lots: InventoryLot[]; movements: StockMovement[];
  invoices: Invoice[]; payments: Payment[]; refunds: Refund[]; sessions: CashSession[];
  expenses: Expense[]; taxes: TaxPolicy[]; audit: AuditEvent
}

function createFiveMonthBundle(actor: ActorContext): DemoBundle {
  const prefix = prefixFor(actor.salonId)
  const random = makeRandom(actor.salonId + ':five-month-demo-v2')
  const rand = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min
  const pick = <T,>(items: readonly T[]) => items[rand(0, items.length - 1)]
  const now = new Date()
  const period = getFiveMonthDemoPeriod(now)
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1, 8)
  const monthStarts = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(currentMonth)
    date.setMonth(date.getMonth() - (4 - index))
    return date
  })
  const startAt = new Date(period.startAt)
  const endAt = new Date(period.endAt)
  const base = (id: string, occurredAt: string) => ({
    id, salonId: actor.salonId, createdAt: occurredAt, updatedAt: occurredAt,
    revision: 1, createdBy: actor.actorId, updatedBy: actor.actorId, deviceId: actor.deviceId,
  })

  const firstNames = ['Thu Trang','Mai Phương','Bảo Ngọc','Minh Châu','Thanh Thảo','Ngọc Ánh','Hà My','Lan Anh','Quỳnh Như','Hải Yến','Khánh Linh','Diệu Nhi']
  const middles = ['Thị','Ngọc','Thanh','Hoàng','Minh','Gia']
  const surnames = ['Nguyễn','Trần','Lê','Phạm','Võ','Đặng','Bùi','Hoàng','Đỗ','Phan']
  const groupNames = ['Khách thân thiết','Khách nhuộm & tạo màu','Khách chăm sóc tóc','Khách mới','Khách mua sản phẩm']
  const groups: CustomerGroup[] = groupNames.map((name, index) => ({
    ...base(prefix + 'group_' + (index + 1), iso(startAt)),
    name, period: index === 0 ? 'month' : index === 1 ? 'quarter' : 'custom',
    description: 'Nhóm mô phỏng để xem phân khúc và báo cáo; không phải dữ liệu khách thật.',
    active: true,
  }))
  const customers: Customer[] = Array.from({ length: 120 }, (_, index) => {
    const fullName = surnames[index % surnames.length] + ' ' + middles[Math.floor(index / 10) % middles.length] + ' ' + firstNames[Math.floor(index / 60) % firstNames.length]
    const phone = '000000' + String(index + 1).padStart(4, '0')
    const customerMonth = monthStarts[rand(0, monthStarts.length - 1)]
    const customerMaxDay = customerMonth.getFullYear() === now.getFullYear() && customerMonth.getMonth() === now.getMonth() ? now.getDate() : new Date(customerMonth.getFullYear(), customerMonth.getMonth() + 1, 0).getDate()
    const created = iso(localDate(customerMonth.getFullYear(), customerMonth.getMonth(), rand(1, Math.max(1, customerMaxDay))))
    return {
      ...base(prefix + 'customer_' + (index + 1), created), fullName,
      normalizedName: fullName.toLocaleLowerCase('vi').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd'), phone, normalizedPhone: phone,
      email: null, notes: 'KHÁCH GIẢ LẬP · Khu vực phục vụ: Ngã Giao / TP.HCM (bối cảnh mô phỏng). Không phải thông tin cá nhân thật.',
      archivedAt: null, groupIds: [groups[index % groups.length].id],
      customFields: { 'Khu vực': 'Ngã Giao – giả lập', 'Sở thích': ['Tóc nhuộm','Tóc uốn','Chăm sóc tóc','Cắt tạo kiểu'][index % 4], 'Nguồn khách': ['Giới thiệu','Đi ngang','Mạng xã hội','Khách quay lại'][index % 4] },
    }
  })

  const employeeNames = ['Nguyễn Minh Anh','Trần Ngọc Hà','Lê Hoàng Yến','Phạm Thùy Linh','Võ Quốc Bảo','Đặng Mỹ Duyên','Bùi Thanh Tâm','Hoàng Gia Hân','Đỗ Tuấn Kiệt','Nguyễn Khánh Vy']
  const roles: Employee['role'][] = ['manager','stylist','stylist','stylist','assistant','assistant','cashier','stylist','assistant','stylist']
  const employees: Employee[] = employeeNames.map((fullName, index) => ({
    ...base(prefix + 'employee_' + (index + 1), iso(localDate(startAt.getFullYear(), startAt.getMonth() - 12, 1 + index))),
    fullName, phone: '09000000' + String(index + 1).padStart(2, '0'), email: null,
    role: roles[index], status: index === 9 ? 'inactive' : 'active',
    joinedAt: iso(localDate(startAt.getFullYear(), startAt.getMonth() - (index % 10 + 3), 1 + index)),
    notes: 'NHÂN SỰ GIẢ LẬP · Thông tin phục vụ kiểm tra lịch ca, phân công và doanh số mẫu.',
  }))

  const serviceDefs = [
    ['Cắt & tạo kiểu',45,180000],['Gội dưỡng sinh',40,150000],['Nhuộm thời trang',150,950000],
    ['Nâng sáng / tẩy tóc',180,1250000],['Uốn định hình',150,880000],['Phục hồi chuyên sâu',90,680000],
    ['Duỗi thẳng',180,1100000],['Tạo kiểu dự tiệc',60,350000],
  ] as const
  const services: Service[] = serviceDefs.map(([name, durationMinutes, priceVnd], index) => ({
    ...base(prefix + 'service_' + (index + 1), iso(startAt)), name,
    description: 'Dịch vụ mô phỏng cho bộ dữ liệu kinh doanh 5 tháng.',
    durationMinutes, priceVnd, active: true,
  }))
  const productDefs = [
    ['Dầu gội phục hồi','CARE-001','Chăm sóc','chai',150000,260000,20],
    ['Dầu xả dưỡng ẩm','CARE-002','Chăm sóc','chai',130000,230000,15],
    ['Tinh dầu dưỡng tóc','CARE-003','Bán lẻ','lọ',180000,320000,12],
    ['Mặt nạ ủ tóc','CARE-004','Chăm sóc','hũ',200000,360000,12],
    ['Thuốc nhuộm nâu lạnh','COLOR-001','Nhuộm','tuýp',95000,180000,30],
    ['Oxy 6%','CHEM-006','Hóa chất','chai',65000,120000,20],
    ['Bột tẩy tóc','BLEACH-001','Hóa chất','gói',90000,165000,10],
    ['Serum bóng tóc','CARE-005','Bán lẻ','lọ',160000,290000,10],
    ['Tinh chất da đầu','CARE-006','Bán lẻ','lọ',140000,250000,10],
    ['Keo xịt tạo kiểu','STYLE-001','Tạo kiểu','chai',110000,195000,10],
    ['Sáp tạo kiểu','STYLE-002','Tạo kiểu','hũ',125000,220000,10],
    ['Ampoule phục hồi','CARE-007','Chăm sóc','ống',80000,155000,20],
  ] as const
  const products: Product[] = productDefs.map(([name, sku, category, unit, cost, price, minimumStock], index) => ({
    ...base(prefix + 'product_' + (index + 1), iso(startAt)), name, sku, category, unit,
    minimumStock, trackingMode: 'lot', active: true,
    customFields: { 'Giá bán mẫu': String(price), 'Giá vốn mẫu': String(cost), 'Đánh dấu': 'DỮ LIỆU MÔ PHỎNG' },
  }))
  const suppliers: Supplier[] = [
    ['Nhà phân phối Mỹ phẩm An Tâm','0000000101','TP.HCM – địa chỉ giả lập'],
    ['Kho vật tư Salon Việt','0000000102','TP.HCM – địa chỉ giả lập'],
    ['Mỹ phẩm chuyên nghiệp Minh Tâm','0000000103','Đồng Nai – địa chỉ giả lập'],
    ['Vật tư tóc Sài Gòn','0000000104','TP.HCM – địa chỉ giả lập'],
  ].map(([name, phone, address], index) => ({
    ...base(prefix + 'supplier_' + (index + 1), iso(startAt)), name, phone, email: null,
    address, notes: 'Nhà cung cấp giả lập; không phải thông tin doanh nghiệp thực.',
    archivedAt: null,
  }))

  const sessions = new Map<string, CashSession>()
  const sessionFor = (date: Date) => {
    const monday = mondayOf(date)
    const key = iso(monday).slice(0, 10)
    let session = sessions.get(key)
    if (!session) {
      const sessionId = prefix + 'cash_session_' + (sessions.size + 1)
      session = {
        ...base(sessionId, iso(monday)), openedAt: iso(localDate(monday.getFullYear(), monday.getMonth(), monday.getDate(), 8)),
        closedAt: iso(localDate(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 20)),
        openingFloatVnd: 1000000, expectedCashVnd: 1000000, countedCashVnd: 1000000,
        differenceVnd: 0, status: 'closed', notes: 'Ca thu ngân tuần mô phỏng.',
      }
      sessions.set(key, session)
    }
    return session
  }

  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const refunds: Refund[] = []
  const appointments: Appointment[] = []
  const pendingUses: PendingUse[] = []
  const serviceStaff = employees.filter(employee => employee.status === 'active' && employee.role === 'stylist')
  const cashier = employees.find(employee => employee.role === 'cashier') ?? employees[0]
  const invoiceCounts = [44, 52, 58, 64, 70]
  let invoiceNumber = 0
  for (let monthIndex = 0; monthIndex < monthStarts.length; monthIndex += 1) {
    const month = monthStarts[monthIndex]
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const maxDay = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth() ? now.getDate() : daysInMonth
    for (let order = 0; order < invoiceCounts[monthIndex]; order += 1) {
      invoiceNumber += 1
      const day = rand(1, Math.max(1, maxDay))
      const date = localDate(month.getFullYear(), month.getMonth(), day, rand(9, 18))
      const issuedAt = iso(date)
      const customer = pick(customers)
      const session = sessionFor(date)
      const invoiceId = prefix + 'invoice_' + invoiceNumber
      const lineData: Array<{ lineType: 'service' | 'product'; referenceId: string; description: string; quantity: number; unitPriceVnd: number; employee: Employee }> = []
      const serviceCount = random() < 0.18 ? 2 : 1
      for (let serviceIndex = 0; serviceIndex < serviceCount; serviceIndex += 1) {
        const service = services[rand(0, services.length - 1)]
        const employee = pick(serviceStaff)
        lineData.push({ lineType: 'service', referenceId: service.id, description: service.name, quantity: 1, unitPriceVnd: service.priceVnd, employee })
        const materialMap: Record<number, Array<[number, number]>> = {
          0: [[0,0.08]], 1: [[0,0.12],[1,0.08]], 2: [[4,1],[5,1]], 3: [[6,1],[5,2]],
          4: [[3,0.25]], 5: [[3,0.4],[11,1]], 6: [[4,1],[5,2]], 7: [[9,0.1]],
        }
        for (const [productIndex, quantity] of materialMap[services.indexOf(service)] ?? []) {
          pendingUses.push({ productIndex, quantity, occurredAt: issuedAt, sourceId: invoiceId, monthKey: monthLabel(date) })
        }
      }
      const productLineCount = random() < 0.52 ? 1 : random() < 0.18 ? 2 : 0
      for (let productIndex = 0; productIndex < productLineCount; productIndex += 1) {
        const index = rand(0, products.length - 1)
        const product = products[index]
        const employee = random() < 0.75 ? pick(serviceStaff) : cashier
        const quantity = rand(1, 2)
        lineData.push({ lineType: 'product', referenceId: product.id, description: product.name, quantity, unitPriceVnd: productDefs[index][5], employee })
        pendingUses.push({ productIndex: index, quantity, occurredAt: issuedAt, sourceId: invoiceId, monthKey: monthLabel(date) })
      }
      const lines = lineData.map((line, lineIndex) => {
        const subtotal = line.quantity * line.unitPriceVnd
        const discountVnd = lineIndex === 0 && random() < 0.12 ? Math.round(subtotal * 0.05) : 0
        const taxVnd = money((subtotal - discountVnd) * 0.08)
        return {
          id: invoiceId + '_line_' + (lineIndex + 1), lineType: line.lineType,
          referenceId: line.referenceId, description: line.description, quantity: line.quantity,
          unitPriceVnd: line.unitPriceVnd, discountVnd, taxRatePercent: 8, taxVnd,
          totalVnd: subtotal - discountVnd + taxVnd, employeeId: line.employee.id,
          employeeNameSnapshot: line.employee.fullName,
        }
      })
      const subtotalVnd = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceVnd, 0)
      const discountVnd = lines.reduce((sum, line) => sum + line.discountVnd, 0)
      const taxVnd = lines.reduce((sum, line) => sum + line.taxVnd, 0)
      const totalVnd = subtotalVnd - discountVnd + taxVnd
      const invoice: Invoice = {
        ...base(invoiceId, issuedAt), invoiceNumber: 'DEMO-' + String(invoiceNumber).padStart(5, '0'),
        customerId: customer.id, customerNameSnapshot: customer.fullName, customerPhoneSnapshot: customer.phone,
        status: 'paid', issuedAt, subtotalVnd, discountVnd, taxVnd, totalVnd,
        amountPaidVnd: totalVnd, lines, notes: 'HÓA ĐƠN GIẢ LẬP · Không phải chứng từ kế toán hoặc hóa đơn thuế hợp pháp.',
        voidedAt: null,
      }
      invoices.push(invoice)
      const method: Payment['method'] = random() < 0.48 ? 'cash' : random() < 0.88 ? 'bank_transfer' : 'card'
      payments.push({
        ...base(prefix + 'payment_' + invoiceNumber, issuedAt), invoiceId, cashSessionId: method === 'cash' ? session.id : null,
        method, amountVnd: totalVnd, paidAt: issuedAt, reference: 'DEMO-PAY-' + String(invoiceNumber).padStart(5, '0'),
        status: 'completed',
      })
      const duration = lineData.filter(line => line.lineType === 'service').reduce((sum, line) => {
        const service = services.find(item => item.id === line.referenceId)
        return sum + (service?.durationMinutes ?? 45)
      }, 0)
      appointments.push({
        ...base(prefix + 'appointment_' + invoiceNumber, issuedAt), customerId: customer.id,
        customerNameSnapshot: customer.fullName, customerPhoneSnapshot: customer.phone,
        startAt: issuedAt, endAt: iso(new Date(date.getTime() + duration * 60000)),
        status: 'completed', serviceIds: lineData.filter(line => line.lineType === 'service').map(line => line.referenceId),
        depositAmount: random() < 0.25 ? 100000 : 0, notes: 'Lịch đã hoàn thành · dữ liệu mô phỏng.',
        cancelledAt: null,
      })
    }
    for (let extra = 0; extra < 8; extra += 1) {
      const date = localDate(month.getFullYear(), month.getMonth(), rand(1, Math.max(1, maxDay)), rand(9, 18))
      const customer = pick(customers)
      const service = pick(services)
      const status: Appointment['status'] = extra < 4 ? 'cancelled' : extra < 6 ? 'no_show' : 'confirmed'
      appointments.push({
        ...base(prefix + 'appointment_extra_' + monthIndex + '_' + extra, iso(date)),
        customerId: customer.id, customerNameSnapshot: customer.fullName, customerPhoneSnapshot: customer.phone,
        startAt: iso(date), endAt: iso(new Date(date.getTime() + service.durationMinutes * 60000)),
        status, serviceIds: [service.id], depositAmount: status === 'cancelled' ? 50000 : 0,
        notes: 'Lịch hẹn phụ giả lập: hủy/không đến/chờ xác nhận.', cancelledAt: status === 'cancelled' ? iso(date) : null,
      })
    }
  }

  const orders: PurchaseOrder[] = []
  const lots: InventoryLot[] = []
  const movements: StockMovement[] = []
  const lotRemaining = new Map<string, number>()
  const lotsByProduct: InventoryLot[][] = products.map(() => [])
  for (let monthIndex = 0; monthIndex < monthStarts.length; monthIndex += 1) {
    const month = monthStarts[monthIndex]
    const monthKey = monthLabel(month)
    const receivedAt = iso(localDate(month.getFullYear(), month.getMonth(), 1, 8))
    const lines = products.map((product, productIndex) => {
      const demand = pendingUses.filter(use => use.productIndex === productIndex && use.monthKey === monthKey).reduce((sum, use) => sum + use.quantity, 0)
      const quantity = Math.ceil(demand + 12)
      const cost = productDefs[productIndex][4]
      return { productId: product.id, productNameSnapshot: product.name, quantity, receivedQuantity: quantity, unitCostVnd: cost }
    })
    const totalAmountVnd = lines.reduce((sum, line) => sum + line.quantity * line.unitCostVnd, 0)
    const supplier = suppliers[monthIndex % suppliers.length]
    const orderId = prefix + 'purchase_' + (monthIndex + 1)
    orders.push({
      ...base(orderId, receivedAt), supplierId: supplier.id, supplierNameSnapshot: supplier.name,
      orderNumber: 'PO-DEMO-' + String(monthIndex + 1).padStart(3, '0'), status: 'received',
      orderedAt: iso(localDate(month.getFullYear(), month.getMonth(), 1, 7)),
      expectedAt: receivedAt, receivedAt, lines, totalAmountVnd,
      notes: 'Đơn nhập kho mô phỏng tháng ' + monthKey + '; số liệu không phải chứng từ thật.',
    })
    for (let productIndex = 0; productIndex < products.length; productIndex += 1) {
      const line = lines[productIndex]
      const lotId = prefix + 'lot_' + (monthIndex + 1) + '_' + (productIndex + 1)
      const lot: InventoryLot = {
        ...base(lotId, receivedAt), productId: line.productId, supplierId: supplier.id, purchaseOrderId: orderId,
        lotCode: 'DEMO-' + monthKey.replace('-', '') + '-' + String(productIndex + 1).padStart(2, '0'),
        receivedAt, expiresAt: iso(localDate(month.getFullYear() + 1, month.getMonth(), 2)),
        quantityReceived: line.quantity, quantityRemaining: line.quantity, unitCostVnd: line.unitCostVnd, status: 'active',
      }
      lots.push(lot); lotsByProduct[productIndex].push(lot); lotRemaining.set(lotId, lot.quantityRemaining)
      movements.push({
        ...base(prefix + 'movement_receipt_' + (monthIndex + 1) + '_' + (productIndex + 1), receivedAt),
        productId: products[productIndex].id, lotId, movementType: 'receipt', direction: 'in',
        quantity: line.quantity, unitCostVnd: line.unitCostVnd, occurredAt: receivedAt,
        sourceId: orderId, notes: 'Nhập kho theo đơn mua mô phỏng.',
      })
    }
  }

  const cogsByMonth = new Map<string, number>()
  const orderedUses = [...pendingUses].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
  let movementIndex = 0
  for (const use of orderedUses) {
    let remaining = use.quantity
    for (const lot of lotsByProduct[use.productIndex]) {
      if (Date.parse(lot.receivedAt) > Date.parse(use.occurredAt) || remaining <= 0) continue
      const available = lotRemaining.get(lot.id) ?? 0
      if (available <= 0) continue
      const used = Math.min(available, remaining)
      lotRemaining.set(lot.id, available - used)
      lot.quantityRemaining = available - used
      lot.status = lot.quantityRemaining <= 0 ? 'depleted' : 'active'
      movements.push({
        ...base(prefix + 'movement_sale_' + (++movementIndex), use.occurredAt),
        productId: products[use.productIndex].id, lotId: lot.id,
        movementType: 'consumption', direction: 'out', quantity: used,
        unitCostVnd: lot.unitCostVnd, occurredAt: use.occurredAt, sourceId: use.sourceId,
        notes: 'Xuất kho mô phỏng cho hóa đơn/dịch vụ.',
      })
      cogsByMonth.set(use.monthKey, (cogsByMonth.get(use.monthKey) ?? 0) + used * lot.unitCostVnd)
      remaining -= used
    }
    if (remaining > 0.0001) throw new Error('Không đủ tồn kho mô phỏng cho sản phẩm ' + products[use.productIndex].name)
  }

  const refundsCandidates = invoices.filter((invoice, index) => index % 47 === 0 && Date.parse(invoice.issuedAt) < Date.parse(endAt.toISOString()))
  for (let index = 0; index < refundsCandidates.length; index += 1) {
    const invoice = refundsCandidates[index]
    const payment = payments.find(item => item.invoiceId === invoice.id)
    if (!payment) continue
    const amountVnd = Math.max(10000, Math.floor(invoice.totalVnd * (0.15 + random() * 0.25)))
    const refundDate = addDays(new Date(invoice.issuedAt), 1)
    if (refundDate > endAt) continue
    const refundedAt = iso(refundDate)
    const session = sessionFor(new Date(refundedAt))
    const refund: Refund = {
      ...base(prefix + 'refund_' + (index + 1), refundedAt), invoiceId: invoice.id,
      paymentId: payment.id, cashSessionId: payment.method === 'cash' ? session.id : null,
      method: payment.method, amountVnd, reason: 'Điều chỉnh dịch vụ/sản phẩm theo tình huống mẫu.',
      refundedAt,
    }
    refunds.push(refund)
    payment.status = 'partially_refunded'
  }

  const expenses: Expense[] = []
  let expenseIndex = 0
  const monthlyFixed = [
    ['Tiền thuê mặt bằng',8500000],['Điện, nước',1800000],['Lương nhân viên',24000000],
    ['Marketing',1200000],['Vệ sinh & giặt khăn',900000],['Internet & phần mềm',450000],
    ['Vật tư vận hành',1100000],
  ] as const
  for (let monthIndex = 0; monthIndex < monthStarts.length; monthIndex += 1) {
    const month = monthStarts[monthIndex]
    for (let itemIndex = 0; itemIndex < monthlyFixed.length; itemIndex += 1) {
      const scheduledDay = Math.min(5 + itemIndex * 3, 26)
      const expenseDay = monthIndex === 4 ? Math.min(scheduledDay, now.getDate()) : scheduledDay
      const date = localDate(month.getFullYear(), month.getMonth(), expenseDay, 15)
      const method: Expense['method'] = itemIndex === 0 || itemIndex === 2 ? 'bank_transfer' : 'cash'
      const session = sessionFor(date)
      expenses.push({
        ...base(prefix + 'expense_' + (++expenseIndex), iso(date)),
        cashSessionId: method === 'cash' ? session.id : null, category: monthlyFixed[itemIndex][0],
        amountVnd: monthlyFixed[itemIndex][1], method, paidAt: iso(date),
        notes: 'Chi phí cố định tháng ' + monthLabel(month) + ' · dữ liệu giả lập.',
      })
    }
    const cogs = money(cogsByMonth.get(monthLabel(month)) ?? 0)
    const cogsDay = monthIndex === 4 ? now.getDate() : Math.min(27, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate())
    const cogsDate = localDate(month.getFullYear(), month.getMonth(), cogsDay, 17)
    expenses.push({
      ...base(prefix + 'expense_' + (++expenseIndex), iso(cogsDate)),
      cashSessionId: null, category: 'Giá vốn hàng bán & hóa chất tiêu hao',
      amountVnd: Math.max(cogs, 1), method: 'bank_transfer', paidAt: iso(cogsDate),
      notes: 'Giá vốn phân bổ theo lượng hàng/vật tư đã xuất kho trong tháng; không cộng lại đơn nhập kho.',
    })
    if (monthIndex === 2) {
      const date = localDate(month.getFullYear(), month.getMonth(), 18, 16)
      expenses.push({
        ...base(prefix + 'expense_' + (++expenseIndex), iso(date)),
        cashSessionId: null, category: 'Bảo trì thiết bị', amountVnd: 1450000,
        method: 'bank_transfer', paidAt: iso(date), notes: 'Chi phí bảo trì định kỳ mô phỏng.',
      })
    }
  }

  const sessionRows = [...sessions.values()]
  for (const session of sessionRows) {
    const cashPayments = payments.filter(payment => payment.cashSessionId === session.id && payment.method === 'cash').reduce((sum, payment) => sum + payment.amountVnd, 0)
    const cashRefunds = refunds.filter(refund => refund.cashSessionId === session.id && refund.method === 'cash').reduce((sum, refund) => sum + refund.amountVnd, 0)
    const cashExpenses = expenses.filter(expense => expense.cashSessionId === session.id && expense.method === 'cash').reduce((sum, expense) => sum + expense.amountVnd, 0)
    const expected = session.openingFloatVnd + cashPayments - cashRefunds - cashExpenses
    const weekEnd = new Date(session.openedAt)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const isCurrentWeek = weekEnd >= new Date(now.getFullYear(), now.getMonth(), now.getDate())
    session.expectedCashVnd = expected
    if (isCurrentWeek) {
      session.status = 'open'
      session.closedAt = null
      session.countedCashVnd = null
      session.differenceVnd = null
    } else {
      const difference = rand(-15000, 15000)
      session.countedCashVnd = expected + difference
      session.differenceVnd = difference
    }
  }

  const taxes: TaxPolicy[] = [{
    ...base(prefix + 'tax_policy_1', iso(startAt)), name: 'Thuế mô phỏng 8%',
    ratePercent: 8, inclusive: false, effectiveFrom: iso(startAt), effectiveTo: null, active: true,
  }]
  const shifts: WorkShift[] = []
  let shiftIndex = 0
  for (let date = new Date(startAt); date <= endAt; date = addDays(date, 1)) {
    if (date.getDay() === 0) continue
    for (let employeeIndex = 1; employeeIndex <= 8; employeeIndex += 1) {
      if ((date.getDate() + employeeIndex) % 7 === 0) continue
      const startHour = employeeIndex % 2 === 0 ? 9 : 11
      const start = localDate(date.getFullYear(), date.getMonth(), date.getDate(), startHour)
      const end = localDate(date.getFullYear(), date.getMonth(), date.getDate(), startHour + 8)
      shifts.push({
        ...base(prefix + 'shift_' + (++shiftIndex), iso(start)), employeeId: employees[employeeIndex].id,
        startAt: iso(start), endAt: iso(end), status: date < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? 'completed' : 'scheduled',
        notes: 'Ca làm 8 giờ · lịch mẫu trong 5 tháng.',
      })
    }
  }
  const commissions: CommissionPolicy[] = employees.filter(employee => employee.status === 'active').map((employee, index) => ({
    ...base(prefix + 'commission_' + (index + 1), iso(startAt)), employeeId: employee.id,
    serviceId: null, mode: 'percent', value: index % 3 === 0 ? 12 : index % 3 === 1 ? 10 : 8,
    effectiveFrom: iso(startAt), effectiveTo: null, active: true,
  }))
  const audit: AuditEvent = {
    id: prefix + 'audit_seed', salonId: actor.salonId, entityType: 'backup',
    entityId: prefix + 'five_month_dataset', action: 'created', occurredAt: iso(now),
    actorId: actor.actorId, deviceId: actor.deviceId,
    summary: 'Đã tạo bộ dữ liệu kinh doanh giả lập 5 tháng; không phải dữ liệu thật.',
  }
  return {
    customers, groups, appointments, services, employees, shifts, commissions, products,
    suppliers, orders, lots, movements, invoices, payments, refunds, sessions: sessionRows,
    expenses, taxes, audit,
  }
}

async function assertNoRealReferences(actor: ActorContext, prefix: string) {
  const isDemo = (id: string | null | undefined) => !!id && id.startsWith(prefix)
  const [customers, groups, appointments, services, employees, shifts, commissions, products, suppliers, orders, lots, movements, invoices, payments, refunds, sessions, expenses, workflowEvents] = await Promise.all([
    salonDb.customers.where('salonId').equals(actor.salonId).toArray(),
    salonDb.customerGroups.where('salonId').equals(actor.salonId).toArray(),
    salonDb.appointments.where('salonId').equals(actor.salonId).toArray(),
    salonDb.services.where('salonId').equals(actor.salonId).toArray(),
    salonDb.employees.where('salonId').equals(actor.salonId).toArray(),
    salonDb.workShifts.where('salonId').equals(actor.salonId).toArray(),
    salonDb.commissionPolicies.where('salonId').equals(actor.salonId).toArray(),
    salonDb.products.where('salonId').equals(actor.salonId).toArray(),
    salonDb.suppliers.where('salonId').equals(actor.salonId).toArray(),
    salonDb.purchaseOrders.where('salonId').equals(actor.salonId).toArray(),
    salonDb.inventoryLots.where('salonId').equals(actor.salonId).toArray(),
    salonDb.stockMovements.where('salonId').equals(actor.salonId).toArray(),
    salonDb.invoices.where('salonId').equals(actor.salonId).toArray(),
    salonDb.payments.where('salonId').equals(actor.salonId).toArray(),
    salonDb.refunds.where('salonId').equals(actor.salonId).toArray(),
    salonDb.cashSessions.where('salonId').equals(actor.salonId).toArray(),
    salonDb.expenses.where('salonId').equals(actor.salonId).toArray(),
    salonDb.workflowEvents.where('salonId').equals(actor.salonId).toArray(),
  ])
  const customerIds = new Set(customers.filter(row => isDemo(row.id)).map(row => row.id))
  const groupIds = new Set(groups.filter(row => isDemo(row.id)).map(row => row.id))
  const serviceIds = new Set(services.filter(row => isDemo(row.id)).map(row => row.id))
  const employeeIds = new Set(employees.filter(row => isDemo(row.id)).map(row => row.id))
  const productIds = new Set(products.filter(row => isDemo(row.id)).map(row => row.id))
  const supplierIds = new Set(suppliers.filter(row => isDemo(row.id)).map(row => row.id))
  const orderIds = new Set(orders.filter(row => isDemo(row.id)).map(row => row.id))
  const lotIds = new Set(lots.filter(row => isDemo(row.id)).map(row => row.id))
  const invoiceIds = new Set(invoices.filter(row => isDemo(row.id)).map(row => row.id))
  const paymentIds = new Set(payments.filter(row => isDemo(row.id)).map(row => row.id))
  const sessionIds = new Set(sessions.filter(row => isDemo(row.id)).map(row => row.id))
  const hasReferences =
    customers.some(row => !isDemo(row.id) && (row.groupIds ?? []).some(id => groupIds.has(id))) ||
    appointments.some(row => !isDemo(row.id) && (customerIds.has(row.customerId ?? '') || row.serviceIds.some(id => serviceIds.has(id)))) ||
    invoices.some(row => !isDemo(row.id) && (customerIds.has(row.customerId ?? '') || row.lines.some(line => serviceIds.has(line.referenceId ?? '') || productIds.has(line.referenceId ?? '')))) ||
    shifts.some(row => !isDemo(row.id) && employeeIds.has(row.employeeId)) ||
    commissions.some(row => !isDemo(row.id) && (employeeIds.has(row.employeeId ?? '') || serviceIds.has(row.serviceId ?? ''))) ||
    orders.some(row => !isDemo(row.id) && (supplierIds.has(row.supplierId) || row.lines.some(line => productIds.has(line.productId)))) ||
    lots.some(row => !isDemo(row.id) && (productIds.has(row.productId) || supplierIds.has(row.supplierId ?? '') || orderIds.has(row.purchaseOrderId ?? ''))) ||
    movements.some(row => !isDemo(row.id) && (productIds.has(row.productId) || lotIds.has(row.lotId ?? ''))) ||
    payments.some(row => !isDemo(row.id) && (invoiceIds.has(row.invoiceId) || sessionIds.has(row.cashSessionId ?? ''))) ||
    refunds.some(row => !isDemo(row.id) && (invoiceIds.has(row.invoiceId) || paymentIds.has(row.paymentId) || sessionIds.has(row.cashSessionId ?? ''))) ||
    expenses.some(row => !isDemo(row.id) && sessionIds.has(row.cashSessionId ?? '')) ||
    workflowEvents.some(row => appointments.some(appointment => isDemo(appointment.id) && appointment.id === row.appointmentId))
  if (hasReferences) throw new Error('Có giao dịch thật đang tham chiếu dữ liệu mẫu. Để bảo toàn lịch sử, ứng dụng không thể thay/xóa bộ mẫu này; hãy xử lý các giao dịch liên quan trước.')
}

export async function seedDemoData(actor: ActorContext) {
  if (!actor.salonId.trim() || !actor.actorId.trim() || !actor.deviceId.trim()) throw new Error('Thiếu ngữ cảnh Owner.')
  const bundle = createFiveMonthBundle(actor)
  const prefix = prefixFor(actor.salonId)
  await salonDb.transaction('rw', [...demoTables], async () => {
    await assertNoRealReferences(actor, prefix)
    for (const table of demoTables) {
      const rows = await table.where('salonId').equals(actor.salonId).toArray()
      const ids = rows.filter(row => row.id.startsWith(prefix)).map(row => row.id)
      if (ids.length) await table.bulkDelete(ids)
    }
    await Promise.all([
      salonDb.customers.bulkAdd(bundle.customers), salonDb.customerGroups.bulkAdd(bundle.groups),
      salonDb.appointments.bulkAdd(bundle.appointments), salonDb.services.bulkAdd(bundle.services),
      salonDb.employees.bulkAdd(bundle.employees), salonDb.workShifts.bulkAdd(bundle.shifts),
      salonDb.commissionPolicies.bulkAdd(bundle.commissions), salonDb.products.bulkAdd(bundle.products),
      salonDb.suppliers.bulkAdd(bundle.suppliers), salonDb.purchaseOrders.bulkAdd(bundle.orders),
      salonDb.inventoryLots.bulkAdd(bundle.lots), salonDb.stockMovements.bulkAdd(bundle.movements),
      salonDb.invoices.bulkAdd(bundle.invoices), salonDb.payments.bulkAdd(bundle.payments),
      salonDb.refunds.bulkAdd(bundle.refunds), salonDb.cashSessions.bulkAdd(bundle.sessions),
      salonDb.expenses.bulkAdd(bundle.expenses), salonDb.taxPolicies.bulkAdd(bundle.taxes),
      salonDb.auditEvents.add(bundle.audit),
    ])
  })
  const period = getFiveMonthDemoPeriod()
  return { created: true, counts: await getDemoDataCounts(actor.salonId), startAt: period.startAt, endAt: period.endAt }
}

export async function clearDemoData(actor: ActorContext) {
  if (!actor.salonId.trim() || !actor.actorId.trim() || !actor.deviceId.trim()) throw new Error('Thiếu ngữ cảnh Owner.')
  const prefix = prefixFor(actor.salonId)
  const removed: DemoCounts = {}
  await salonDb.transaction('rw', [...demoTables], async () => {
    await assertNoRealReferences(actor, prefix)
    for (const table of demoTables) {
      const rows = await table.where('salonId').equals(actor.salonId).toArray()
      const ids = rows.filter(row => row.id.startsWith(prefix)).map(row => row.id)
      if (ids.length) {
        await table.bulkDelete(ids)
        removed[table.name] = ids.length
      }
    }
  })
  return removed
}
