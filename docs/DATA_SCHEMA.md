# Data schema – định hướng

## Firestore metadata
salons/{salonId}; memberships/{uid}; invitations/{inviteId}; devices/{deviceId}; deviceApprovals/{requestId}; backupMetadata/{backupId}; signaling/{sessionId}; auditLogs/{eventId}.

## IndexedDB
customers, customerConsents, customerPhotos, appointments, appointmentServices, services, serviceSteps, serviceMaterials, workSessions, workStepEvents, colorFormulas, formulaItems, employees, workShifts, commissionPolicies, products, inventoryLots, stockMovements, suppliers, purchaseOrders, invoices, invoiceItems, payments, refunds, expenses, cashSessions, taxPolicies, changeLogs, revisions, conflicts, auditEvents, appSettings.

Mỗi entity cần ID ổn định, salonId, createdAt, updatedAt, revision và actor/device provenance phù hợp. Schema và index phải được chốt bằng migration có test trước khi nghiệp vụ sử dụng.