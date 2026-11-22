import { salonDb } from './database'
import type { ActorContext, Appointment, AuditEvent, Customer, Employee, Product, Service, Supplier, WorkShift, CommissionPolicy } from './types'

const prefixFor = (salonId: string) => `demo_${salonId}_`
const at = (dayOffset: number, hour: number) => {
  const value = new Date()
  value.setDate(value.getDate() + dayOffset)
  value.setHours(hour, 0, 0, 0)
  return value.toISOString()
}

export type DemoCounts = Record<string, number>
const demoTables = [
  salonDb.customers, salonDb.appointments, salonDb.services, salonDb.employees,
  salonDb.workShifts, salonDb.commissionPolicies, salonDb.products, salonDb.suppliers,
  salonDb.auditEvents,
] as const

export async function getDemoDataCounts(salonId: string): Promise<DemoCounts> {
  const prefix = prefixFor(salonId)
  const entries = await Promise.all(demoTables.map(async table => {
    const rows = await table.where('salonId').equals(salonId).toArray()
    return [table.name, rows.filter(row => row.id.startsWith(prefix)).length] as const
  }))
  return Object.fromEntries(entries)
}

export async function seedDemoData(actor: ActorContext) {
  if (!actor.salonId.trim() || !actor.actorId.trim() || !actor.deviceId.trim()) throw new Error('Thiếu ngữ cảnh Owner.')
  const existing = await getDemoDataCounts(actor.salonId)
  if (Object.values(existing).some(count => count > 0)) return { created: false, counts: existing }
  const prefix = prefixFor(actor.salonId)
  const now = new Date().toISOString()
  const base = (id: string) => ({ id, salonId: actor.salonId, createdAt: now, updatedAt: now, revision: 1, createdBy: actor.actorId, updatedBy: actor.actorId, deviceId: actor.deviceId })

  const employeeNames = ['Nguyễn Minh Anh','Trần Ngọc Hà','Lê Hoàng Yến','Phạm Thùy Linh','Võ Quốc Bảo','Đặng Mỹ Duyên','Bùi Thanh Tâm','Hoàng Gia Hân','Đỗ Tuấn Kiệt','Nguyễn Khánh Vy']
  const employees: Employee[] = employeeNames.map((fullName, index) => ({
    ...base(prefix+`employee_${index+1}`), fullName, phone: `09000000${String(index+1).padStart(2,'0')}`,
    email: null, role: (['manager','stylist','stylist','stylist','assistant','assistant','cashier','stylist','assistant','stylist'] as Employee['role'][])[index],
    status: 'active', joinedAt: at(-180+index*7,9), notes: 'DỮ LIỆU MẪU – có thể chỉnh sửa hoặc xóa riêng.',
  }))
  const customerNames = ['Nguyễn Thu Trang','Trần Mai Phương','Lê Bảo Ngọc','Phạm Minh Châu','Võ Thanh Thảo','Đặng Ngọc Ánh','Bùi Hà My','Hoàng Lan Anh','Đỗ Quỳnh Như','Nguyễn Hải Yến']
  const customers: Customer[] = customerNames.map<Customer>((fullName,index)=>({
    ...base(prefix+`customer_${index+1}`), fullName, normalizedName: fullName.toLocaleLowerCase('vi'),
    phone: `09120000${String(index+1).padStart(2,'0')}`, normalizedPhone: `09120000${String(index+1).padStart(2,'0')}`,
    email:null, notes:'Khách hàng minh họa – dữ liệu mẫu.', archivedAt:null,
  }))
  const serviceDefs = [
    ['Cắt & tạo kiểu',45,180000],['Gội dưỡng sinh',40,150000],['Nhuộm thời trang',150,950000],
    ['Nâng sáng / tẩy tóc',180,1200000],['Uốn định hình',150,850000],['Phục hồi chuyên sâu',90,650000],
  ] as const
  const services: Service[] = serviceDefs.map<Service>(([name,durationMinutes,priceVnd],index)=>({
    ...base(prefix+`service_${index+1}`), name, description:'Dịch vụ mẫu để kiểm tra lịch hẹn và thu ngân.',
    durationMinutes, priceVnd, active:true,
  }))
  const appointments: Appointment[] = customers.slice(0,8).map<Appointment>((customer,index)=>{
    const startAt=at(index<4?0:index-6,9+index)
    return {...base(prefix+`appointment_${index+1}`),customerId:customer.id,customerNameSnapshot:customer.fullName,
      customerPhoneSnapshot:customer.phone,startAt,endAt:new Date(Date.parse(startAt)+services[index%services.length].durationMinutes*60000).toISOString(),
      status:(['completed','completed','in_service','confirmed','scheduled','scheduled','cancelled','no_show'] as Appointment['status'][])[index],
      serviceIds:[services[index%services.length].id],depositAmount:index%3===0?100000:0,notes:'Lịch hẹn minh họa.',cancelledAt:null}
  })
  const shifts: WorkShift[] = employees.map<WorkShift>((employee,index)=>({
    ...base(prefix+`shift_${index+1}`),employeeId:employee.id,startAt:at(0,8+index%3),endAt:at(0,16+index%3),
    status:'scheduled',notes:'Ca làm mẫu.',
  }))
  const commissions: CommissionPolicy[] = employees.map<CommissionPolicy>((employee,index)=>({
    ...base(prefix+`commission_${index+1}`),employeeId:employee.id,serviceId:null,mode:'percent',value:index%2===0?10:8,
    effectiveFrom:at(-30,0),effectiveTo:null,active:true,
  }))
  const productDefs = [
    ['Dầu gội phục hồi','HAIR-001','Chăm sóc','chai',20],['Dầu xả dưỡng ẩm','HAIR-002','Chăm sóc','chai',15],
    ['Thuốc nhuộm nâu lạnh','COLOR-001','Nhuộm','tuýp',30],['Oxy 6%','CHEM-006','Hóa chất','chai',20],
    ['Bột tẩy tóc','BLEACH-001','Hóa chất','gói',10],['Tinh dầu dưỡng tóc','CARE-003','Bán lẻ','lọ',12],
  ] as const
  const products: Product[] = productDefs.map<Product>(([name,sku,category,unit,minimumStock],index)=>({
    ...base(prefix+`product_${index+1}`),name,sku,category,unit,minimumStock,trackingMode:'lot',active:true,
  }))
  const suppliers: Supplier[] = [
    {...base(prefix+'supplier_1'),name:'Nhà phân phối Mỹ phẩm An Tâm',phone:'02839000001',email:null,address:'TP. Hồ Chí Minh',notes:'Nhà cung cấp mẫu.',archivedAt:null},
    {...base(prefix+'supplier_2'),name:'Kho vật tư Salon Việt',phone:'02839000002',email:null,address:'Hà Nội',notes:'Nhà cung cấp mẫu.',archivedAt:null},
  ]
  const audit: AuditEvent = {id:prefix+'audit_seed',salonId:actor.salonId,entityType:'employee',entityId:prefix+'dataset',
    action:'created',occurredAt:now,actorId:actor.actorId,deviceId:actor.deviceId,summary:'Đã nạp bộ dữ liệu mẫu Owner App.'}

  await salonDb.transaction('rw', [...demoTables], async()=>{
    const check = await salonDb.employees.where('salonId').equals(actor.salonId).filter(row=>row.id.startsWith(prefix)).count()
    if (check) throw new Error('Dữ liệu mẫu vừa được tạo ở một phiên khác. Hãy tải lại trang.')
    await Promise.all([
      salonDb.employees.bulkAdd(employees), salonDb.customers.bulkAdd(customers),
      salonDb.services.bulkAdd(services), salonDb.appointments.bulkAdd(appointments),
      salonDb.workShifts.bulkAdd(shifts), salonDb.commissionPolicies.bulkAdd(commissions),
      salonDb.products.bulkAdd(products), salonDb.suppliers.bulkAdd(suppliers), salonDb.auditEvents.add(audit),
    ])
  })
  return {created:true,counts:await getDemoDataCounts(actor.salonId)}
}

export async function clearDemoData(actor: ActorContext) {
  if (!actor.salonId.trim() || !actor.actorId.trim()) throw new Error('Thiếu ngữ cảnh Owner.')
  const prefix=prefixFor(actor.salonId)
  const removed:DemoCounts={}
  await salonDb.transaction('rw', ...demoTables, async()=>{
    for (const table of demoTables) {
      const rows=await table.where('salonId').equals(actor.salonId).toArray()
      const ids=rows.filter(row=>row.id.startsWith(prefix)).map(row=>row.id)
      if(ids.length){await table.bulkDelete(ids);removed[table.name]=ids.length}
    }
  })
  return removed
}
