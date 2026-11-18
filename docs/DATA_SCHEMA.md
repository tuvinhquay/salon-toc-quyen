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
