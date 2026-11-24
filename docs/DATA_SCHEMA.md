# Data schema – định hướng

## Firestore metadata
salons/{salonId}; memberships/{uid}; invitations/{inviteId}; devices/{deviceId}; deviceApprovals/{requestId}; backupMetadata/{backupId}; signaling/{sessionId}; auditLogs/{eventId}.

## IndexedDB
customers, customerConsents, customerPhotos, appointments, appointmentServices, services, serviceSteps, serviceMaterials, workSessions, workStepEvents, colorFormulas, formulaItems, employees, workShifts, commissionPolicies, products, inventoryLots, stockMovements, suppliers, purchaseOrders, invoices, invoiceItems, payments, refunds, expenses, cashSessions, taxPolicies, changeLogs, revisions, conflicts, auditEvents, appSettings.

Mỗi entity cần ID ổn định, salonId, createdAt, updatedAt, revision và actor/device provenance phù hợp. Schema và index phải được chốt bằng migration có test trước khi nghiệp vụ sử dụng.
## P06 – Nhân sự
- Employee: hồ sơ và role trong salon (manager, stylist, assistant, cashier), trạng thái active/inactive.
- WorkShift: employeeId, startAt/endAt, status; chặn ca trùng cho cùng nhân viên.
- CommissionPolicy: có thể áp dụng toàn salon hoặc theo nhân viên/dịch vụ; percent hoặc fixed VND, có hiệu lực theo thời gian. Đây là chính sách, chưa phải ledger hoa hồng đã thanh toán.
## P07 – Kho
- Product: SKU, danh mục, đơn vị, simple/lot tracking và ngưỡng tồn tối thiểu.
- Supplier: thông tin nhà cung cấp.
- PurchaseOrder: supplier snapshot, order number, line items, quantity, received quantity, unit cost và trạng thái nhận từng phần/toàn phần.
- InventoryLot: mã lô, ngày nhận, hạn dùng, số lượng nhận/còn lại và giá vốn.
- StockMovement: receipt/consumption/adjustment/return, direction, quantity, cost, source và actor/device provenance.
- Nhận hàng từ PO tạo lot + stock movement + audit trong cùng transaction. FIFO/FEFO và tiêu hao sẽ được triển khai trong các bước kho tiếp theo.

## P08 – Thu ngân & hóa đơn
- TaxPolicy: thuế suất, inclusive/exclusive và khoảng hiệu lực.
- Invoice: snapshot khách, dòng dịch vụ/sản phẩm/custom, giá, chiết khấu, thuế, tổng và số đã thu.
- Payment: phương thức cash/bank transfer/card/other; partial payment và trạng thái hoàn.
- Refund: liên kết payment/invoice, số tiền, phương thức, lý do và ca thu ngân nếu hoàn tiền mặt.
- CashSession: tiền đầu ca, tiền mặt dự kiến, tiền kiểm đếm, chênh lệch và trạng thái.
- Expense: nhóm chi phí, số tiền, phương thức và cash session khi chi tiền mặt.
- Phát hành dòng sản phẩm trừ tồn theo FEFO trong cùng transaction với hóa đơn.
## P09 – Báo cáo
- getSalesReport tổng hợp số hóa đơn, doanh số phát hành, tiền thu, tiền hoàn, chi phí và thu ròng theo khoảng thời gian.
- Chưa bao gồm lợi nhuận theo giá vốn, hoa hồng thực trả, báo cáo thuế pháp lý hoặc hóa đơn điện tử.

## P10 – Thiết bị và đồng bộ
- DeviceRecord: deviceId, label, platform, pending/approved/revoked, publicKey placeholder, approval/revocation timestamps.
- ChangeLog: entity identity, base/entity revision và encryptedPayload; không chấp nhận plaintext payload.
- SyncConflict: local/remote revision và trạng thái open/resolved.
- SyncCursor: peer device, last sync time và last change id.
- Secure sync packet: AES-GCM-256, PBKDF2-SHA-256, context binding; kiểm tra tenant và peer. Chưa có transport P2P.
## P11 – Backup
- BackupRecord metadata: schema/format version, SHA-256 hash, size và số lượng record theo bảng.
- Backup payload chứa dữ liệu của đúng salon; mã hóa AES-GCM-256 với PBKDF2 SHA-256 310.000 iterations, salt và IV ngẫu nhiên.
- Restore kiểm tra checksum, giải mã, kiểm tra salonId trên toàn bộ record; merge bỏ qua revision cũ hơn, replace chỉ xóa dữ liệu của salon đang xác thực.
- Backup hiện tải tệp cục bộ; chưa có upload Google Drive/cloud.


## P25 – Tenant ownership and assistant learning
- `salons/{salonId}`: tenant metadata; owner UID, display name, status, timestamps and plan. Client can read only its own salon metadata; no client writes.
- `memberships/{uid}`: one active owner membership maps a Google UID to one salonId. A first-time Google user creates this document atomically with `salons/{salonId}`; Firestore Rules require matching ownership in both post-write states. The browser cannot create a membership alone, change roles, update, or delete it.
- One owner UID → one salon tenant. A second Google account gets a distinct salonId and therefore a separate IndexedDB data partition.
- All local business records continue to carry `salonId`; assistant memories are additionally scoped by `ownerId`.
- Assistant memory category `shortcut`: an owner-authored natural-language business query that maps similar future wording to a deterministic read-only analytics query. Example: “Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này”.
- Quarter reporting uses Asia/Ho_Chi_Minh calendar boundaries.
- Staff ranking currently measures completed WorkShift hours/count only. It is not attributed service revenue or proven productivity; employee attribution must be added to service/invoice records in a later phase.
- Local-first records and assistant shortcuts are not yet synced across devices.


## P27 – Owner handover without Cloud Functions
- First-time Google owner onboarding uses one Firestore write batch to create `salons/{salonId}` and `memberships/{uid}` together.
- Firestore Rules permit only a Google-authenticated UID to create its own first active owner membership, paired atomically with a salon whose `ownerUid` and `salonId` match. Existing memberships cannot be overwritten; salon and membership updates/deletes remain denied to clients.
- No Cloud Functions SDK or function source is used by the app. Local assistant, Dexie data, assistant memory, and optional Gemini via Firebase AI Logic remain separate.
