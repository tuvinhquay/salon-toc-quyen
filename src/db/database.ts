import Dexie, { type Table } from 'dexie'
import type { Appointment, AuditEvent, AssistantMemoryRecord, BackupRecord, CashSession, ChangeLog, CommissionPolicy, Customer, DeviceRecord, Employee, Expense, InventoryLot, Invoice, Payment, Product, PurchaseOrder, Refund, Service, StockMovement, Supplier, SyncConflict, SyncCursor, TaxPolicy, WorkShift, WorkflowEvent } from './types'

export class SalonDatabase extends Dexie {
  customers!: Table<Customer, string>
  appointments!: Table<Appointment, string>
  services!: Table<Service, string>
  workflowEvents!: Table<WorkflowEvent, string>
  auditEvents!: Table<AuditEvent, string>
  employees!: Table<Employee, string>
  workShifts!: Table<WorkShift, string>
  commissionPolicies!: Table<CommissionPolicy, string>
  products!: Table<Product, string>
  suppliers!: Table<Supplier, string>
  purchaseOrders!: Table<PurchaseOrder, string>
  inventoryLots!: Table<InventoryLot, string>
  stockMovements!: Table<StockMovement, string>
  invoices!: Table<Invoice, string>
  payments!: Table<Payment, string>
  refunds!: Table<Refund, string>
  cashSessions!: Table<CashSession, string>
  expenses!: Table<Expense, string>
  taxPolicies!: Table<TaxPolicy, string>
  devices!: Table<DeviceRecord, string>
  changeLogs!: Table<ChangeLog, string>
  syncConflicts!: Table<SyncConflict, string>
  syncCursors!: Table<SyncCursor, string>
  backupRecords!: Table<BackupRecord, string>
  assistantMemories!: Table<AssistantMemoryRecord, string>

  constructor() {
    super('salon-toc-quyen')
    const v1 = {
      customers: 'id,salonId,normalizedName,normalizedPhone,updatedAt,[salonId+normalizedPhone]',
      appointments: 'id,salonId,customerId,startAt,endAt,status,updatedAt,[salonId+startAt],[salonId+customerId]',
      services: 'id,salonId,name,active,updatedAt',
      auditEvents: 'id,salonId,entityType,entityId,occurredAt,[salonId+occurredAt]',
    }
    const v2 = {
      customers: 'id,salonId,normalizedName,normalizedPhone,updatedAt,archivedAt,[salonId+normalizedPhone]',
      appointments: 'id,salonId,customerId,startAt,endAt,status,updatedAt,[salonId+startAt],[salonId+customerId]',
      services: 'id,salonId,name,active,updatedAt',
      workflowEvents: 'id,salonId,appointmentId,serviceId,eventType,occurredAt,[salonId+appointmentId],[salonId+occurredAt]',
      auditEvents: 'id,salonId,entityType,entityId,occurredAt,[salonId+occurredAt]',
    }
    const v3 = {
      ...v2,
      employees: 'id,salonId,fullName,phone,role,status,updatedAt,[salonId+status]',
      workShifts: 'id,salonId,employeeId,startAt,endAt,status,[salonId+employeeId],[salonId+startAt]',
      commissionPolicies: 'id,salonId,employeeId,serviceId,active,effectiveFrom,[salonId+employeeId]',
      products: 'id,salonId,name,sku,category,active,trackingMode,updatedAt',
      suppliers: 'id,salonId,name,archivedAt,updatedAt',
      purchaseOrders: 'id,salonId,supplierId,orderNumber,status,orderedAt,expectedAt,[salonId+status]',
      inventoryLots: 'id,salonId,productId,supplierId,purchaseOrderId,lotCode,expiresAt,status,[salonId+productId],[salonId+expiresAt]',
      stockMovements: 'id,salonId,productId,lotId,movementType,direction,occurredAt,[salonId+productId],[salonId+occurredAt]',
    }
    const v4 = {
      ...v3,
      invoices: 'id,salonId,invoiceNumber,customerId,status,issuedAt,[salonId+issuedAt]',
      payments: 'id,salonId,invoiceId,cashSessionId,method,paidAt,[salonId+invoiceId],[salonId+cashSessionId]',
      refunds: 'id,salonId,invoiceId,paymentId,cashSessionId,refundedAt,[salonId+paymentId]',
      cashSessions: 'id,salonId,status,openedAt,closedAt,[salonId+status]',
      expenses: 'id,salonId,cashSessionId,category,method,paidAt,[salonId+cashSessionId]',
      taxPolicies: 'id,salonId,active,effectiveFrom,[salonId+active]',
    }
    this.version(1).stores(v1)
    this.version(2).stores(v2)
    this.version(3).stores(v3)
    this.version(4).stores(v4)
    const v5 = {
      ...v4,
      devices: 'id,salonId,deviceId,status,updatedAt,[salonId+deviceId],[salonId+status]',
      changeLogs: 'id,salonId,entityType,entityId,operation,createdAt,syncedAt,[salonId+syncedAt],[salonId+createdAt]',
      syncConflicts: 'id,salonId,entityType,entityId,status,detectedAt,[salonId+status]',
      syncCursors: 'id,salonId,peerDeviceId,lastSyncedAt,[salonId+peerDeviceId]',
      backupRecords: 'id,salonId,createdAt,schemaVersion,ciphertextHash,[salonId+createdAt]',
    }
    this.version(5).stores(v5)
    this.version(6).stores({
      ...v5,
      assistantMemories: 'id,salonId,ownerId,category,status,updatedAt,[salonId+ownerId],[salonId+category],[salonId+status]',
    })
  }
}

export const salonDb = new SalonDatabase()
export async function closeSalonDatabase() {
  salonDb.close()
}
