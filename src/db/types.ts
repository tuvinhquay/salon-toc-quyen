export type EntityId=string
export interface BaseEntity{id:EntityId;salonId:EntityId;createdAt:string;updatedAt:string;revision:number;createdBy:string;updatedBy:string;deviceId:string}
export type Customer=BaseEntity&{fullName:string;normalizedName:string;phone:string|null;normalizedPhone:string|null;email:string|null;notes:string;archivedAt:string|null}
export type AppointmentStatus='scheduled'|'confirmed'|'checked_in'|'in_service'|'completed'|'cancelled'|'no_show'
export type Appointment=BaseEntity&{customerId:EntityId|null;customerNameSnapshot:string;customerPhoneSnapshot:string|null;startAt:string;endAt:string;status:AppointmentStatus;serviceIds:EntityId[];depositAmount:number;notes:string;cancelledAt:string|null}
export type Service=BaseEntity&{name:string;description:string;durationMinutes:number;priceVnd:number;active:boolean}
export type HairFormulaSnapshot={category:'color'|'bleach'|'treatment'|'other';products:Array<{productName:string;amount:string;unit:string}>;developer:string;processingMinutes:number|null;targetResult:string;notes:string}
export type WorkflowEvent={id:string;salonId:string;appointmentId:string;serviceId:string|null;eventType:'consultation'|'formula_recorded'|'step_started'|'step_paused'|'step_completed'|'handover'|'note';occurredAt:string;actorId:string;deviceId:string;note:string;formula:HairFormulaSnapshot|null}
export type EmployeeRole='manager'|'stylist'|'assistant'|'cashier'
export type Employee=BaseEntity&{fullName:string;phone:string|null;email:string|null;role:EmployeeRole;status:'active'|'inactive';joinedAt:string;notes:string}
export type WorkShift=BaseEntity&{employeeId:string;startAt:string;endAt:string;status:'scheduled'|'checked_in'|'completed'|'cancelled';notes:string}
export type CommissionPolicy=BaseEntity&{employeeId:string|null;serviceId:string|null;mode:'percent'|'fixed_vnd';value:number;effectiveFrom:string;effectiveTo:string|null;active:boolean}
export type Product=BaseEntity&{name:string;sku:string|null;category:string;unit:string;trackingMode:'simple'|'lot';minimumStock:number;active:boolean}
export type Supplier=BaseEntity&{name:string;phone:string|null;email:string|null;address:string;notes:string;archivedAt:string|null}
export type PurchaseOrderStatus='draft'|'submitted'|'partially_received'|'received'|'cancelled'
export type PurchaseOrderLine={productId:string;productNameSnapshot:string;quantity:number;receivedQuantity:number;unitCostVnd:number}
export type PurchaseOrder=BaseEntity&{supplierId:string;supplierNameSnapshot:string;orderNumber:string;status:PurchaseOrderStatus;orderedAt:string;expectedAt:string|null;receivedAt:string|null;lines:PurchaseOrderLine[];totalAmountVnd:number;notes:string}
export type InventoryLot=BaseEntity&{productId:string;supplierId:string|null;purchaseOrderId:string|null;lotCode:string;receivedAt:string;expiresAt:string|null;quantityReceived:number;quantityRemaining:number;unitCostVnd:number;status:'active'|'depleted'|'expired'}
export type StockMovement=BaseEntity&{productId:string;lotId:string|null;movementType:'receipt'|'consumption'|'adjustment'|'return';direction:'in'|'out';quantity:number;unitCostVnd:number;occurredAt:string;sourceId:string|null;notes:string}
export type AuditEvent={id:string;salonId:string;entityType:'assistant_memory'|'customer'|'appointment'|'service'|'workflow'|'employee'|'shift'|'commission'|'product'|'supplier'|'purchase_order'|'inventory_lot'|'stock_movement'|'invoice'|'payment'|'refund'|'cash_session'|'expense'|'tax_policy'|'device'|'change_log'|'sync_conflict'|'backup';entityId:string;action:'created'|'updated'|'archived'|'status_changed'|'event_recorded'|'received'|'paid'|'refunded'|'closed'|'approved'|'revoked'|'synced'|'resolved'|'restored';occurredAt:string;actorId:string;deviceId:string;summary:string}
export type ActorContext={salonId:string;actorId:string;deviceId:string}

export type InvoiceStatus='issued'|'partially_paid'|'paid'|'void'|'refunded'
export type InvoiceLineSnapshot={id:string;lineType:'service'|'product'|'custom';referenceId:string|null;description:string;quantity:number;unitPriceVnd:number;discountVnd:number;taxRatePercent:number;taxVnd:number;totalVnd:number}
export type Invoice=BaseEntity&{invoiceNumber:string;customerId:string|null;customerNameSnapshot:string;customerPhoneSnapshot:string|null;status:InvoiceStatus;issuedAt:string;subtotalVnd:number;discountVnd:number;taxVnd:number;totalVnd:number;amountPaidVnd:number;lines:InvoiceLineSnapshot[];notes:string;voidedAt:string|null}
export type PaymentMethod='cash'|'bank_transfer'|'card'|'other'
export type Payment=BaseEntity&{invoiceId:string;cashSessionId:string|null;method:PaymentMethod;amountVnd:number;paidAt:string;reference:string;status:'completed'|'partially_refunded'|'refunded'|'void'}
export type Refund=BaseEntity&{invoiceId:string;paymentId:string;cashSessionId:string|null;method:PaymentMethod;amountVnd:number;reason:string;refundedAt:string}
export type CashSession=BaseEntity&{openedAt:string;closedAt:string|null;openingFloatVnd:number;expectedCashVnd:number|null;countedCashVnd:number|null;differenceVnd:number|null;status:'open'|'closed';notes:string}
export type Expense=BaseEntity&{cashSessionId:string|null;category:string;amountVnd:number;method:PaymentMethod;paidAt:string;notes:string}
export type TaxPolicy=BaseEntity&{name:string;ratePercent:number;inclusive:boolean;effectiveFrom:string;effectiveTo:string|null;active:boolean}

export type DeviceStatus='pending'|'approved'|'revoked'
export type DeviceRecord=BaseEntity&{deviceId:string;label:string;platform:string;status:DeviceStatus;publicKey:string|null;approvedAt:string|null;revokedAt:string|null;lastSeenAt:string|null}
export type ChangeLog=BaseEntity&{entityType:string;entityId:string;operation:'create'|'update'|'archive';baseRevision:number;entityRevision:number;encryptedPayload:string;createdAt:string;syncedAt:string|null}
export type SyncConflict=BaseEntity&{entityType:string;entityId:string;localRevision:number;remoteRevision:number;detectedAt:string;status:'open'|'resolved';resolution:string|null}
export type SyncCursor=BaseEntity&{peerDeviceId:string;lastSyncedAt:string|null;lastChangeId:string|null}
export type BackupRecord=BaseEntity&{createdAt:string;schemaVersion:number;formatVersion:number;ciphertextHash:string;sizeBytes:number;recordCounts:Record<string,number>}


export type AssistantMemoryCategory='profile'|'preference'|'routine'|'project'|'knowledge'
export type AssistantMemoryRecord=BaseEntity&{ownerId:string;category:AssistantMemoryCategory;title:string;content:string;keywords:string[];status:'active'|'archived';syncState:'local_only'}
