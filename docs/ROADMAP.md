# ROADMAP – Salon TÓC QUYỀN
Phạm vi giai đoạn 1: Owner App. Employee App là giai đoạn 2, không trộn giao diện nhân viên trước khi Owner nghiệm thu.
| ID | Hạng mục | Trạng thái |
|---|---|---|
| P01 | Repository, cấu trúc, UI shell | IN PROGRESS |
| P02 | Firebase Auth, Owner membership, Rules | IN PROGRESS |
| P03 | Dexie schema, migration, validation | IN PROGRESS |
| P04 | Khách hàng và lịch hẹn | IN PROGRESS |
| P05 | Dịch vụ, công thức, workflow event log | IN PROGRESS |
| P06 | Nhân viên, ca làm, quyền, hoa hồng | IN PROGRESS |
| P07 | Kho, lô, vật tư tiêu hao | IN PROGRESS |
| P08 | POS, hóa đơn, thanh toán, thuế | IN PROGRESS |
| P09 | Dashboard và báo cáo | IN PROGRESS |
| P10 | Thiết bị, E2E encryption, conflict | NOT STARTED |
| P11 | Backup/restore mã hóa | NOT STARTED |
| P12 | Gemini server API, quota, quyền | NOT STARTED |
| P13 | PWA, bảo mật và nghiệm thu | NOT STARTED |
| E01 | Employee App độc lập theo vai trò | GIAI ĐOẠN 2 – CHƯA TRIỂN KHAI |
## Definition of Done
Nghiệp vụ thật; validation; error handling; tenant isolation; audit trail; unit/integration/regression tests; typecheck, lint, build; mobile/desktop verification; tài liệu và session log. Chỉ PASS khi có bằng chứng.
## P04 + P05 – 2026-11-18
- Dexie schema version 2 bổ sung workflowEvents và giữ migration version 1.
- Thêm local-first repositories cho khách hàng, lịch hẹn, dịch vụ và nhật ký sự kiện quy trình.
- Các thao tác yêu cầu ActorContext, giới hạn salonId và ghi audit trong cùng transaction.
- Lịch hẹn có tiền cọc, snapshot khách và state transition được kiểm soát.
- Công thức tóc lưu dạng snapshot append-only cùng workflow event.
- Schema tests được mở rộng; CI và IndexedDB/browser smoke test đang chờ.
- Chưa có UI CRUD nghiệp vụ, chưa tích hợp nhân viên/kho/cloud sync.

## Cập nhật triển khai UI P04 + P05 – 2026-11-19
- Đã bổ sung OwnerContext chỉ được tạo sau khi AuthGate xác minh Google user có membership active, role owner và salonId hợp lệ.
- Đã kết nối CRUD khách hàng: tạo, đọc, tìm kiếm, sửa và lưu trữ; mọi thao tác đi qua repository có salon scope và audit.
- Đã kết nối CRUD dịch vụ: tạo, đọc, sửa; validate thời lượng và giá VND qua schema.
- Đã bổ sung giao diện tạo lịch hẹn: chọn khách hàng, dịch vụ, thời gian, tiền cọc; trạng thái có luồng chuyển tiếp giới hạn.
- Đã bổ sung giao diện nhật ký quy trình và lưu snapshot công thức tóc theo lịch hẹn.
- UI chưa được nghiệm thu trên trình duyệt/Termux thật; IndexedDB integration test, kiểm tra dữ liệu nhiều salon, quyền Firestore và backup còn chờ.
- P04/P05 vẫn IN PROGRESS; CI của commit mới nhất đang chạy. Không đánh dấu PASS trước khi có kiểm thử runtime và regression.

- Bổ sung kiểm thử chuẩn hóa tên tiếng Việt và số điện thoại; đã sửa regex để loại bỏ dấu phân cách số điện thoại và dấu thanh Unicode đúng cách.

## P06 + P07 – 2026-11-19
- Dexie schema version 3 bổ sung employees, workShifts, commissionPolicies, products, suppliers, purchaseOrders, inventoryLots và stockMovements; giữ migration v1/v2.
- Thêm schema validation cho nhân viên, ca làm, chính sách hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Repository P06 có hồ sơ nhân viên, xếp ca (chặn trùng ca cùng nhân viên) và chính sách hoa hồng theo nhân viên/dịch vụ.
- Repository P07 có danh mục sản phẩm, nhà cung cấp, tạo đơn mua, nhận hàng từng phần, tạo lô và stock movement trong transaction.
- UI Owner đã nối quản lý nhân viên, ca, hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- P06/P07 vẫn IN PROGRESS: chưa có integration test IndexedDB, kiểm thử thực tế trên thiết bị, điều chỉnh tồn kho/tiêu hao và kiểm tra hạn dùng tự động.

## P08 + P09 – 2026-11-19
- Dexie schema v4 bổ sung invoices, payments, refunds, cashSessions, expenses và taxPolicies.
- Repository phát hành hóa đơn với snapshot dòng hàng, chính sách thuế hiệu lực và kiểm tra khách/dịch vụ/sản phẩm.
- Bán sản phẩm trừ tồn FEFO từ inventory lots; invoice + lot update + stock movement + audit nằm trong một transaction, thiếu tồn thì rollback.
- Payment hỗ trợ cash/bank transfer/card/other, partial payment và kiểm tra số dư hóa đơn.
- Refund hỗ trợ hoàn một phần/toàn phần; hoàn tiền mặt yêu cầu ca thu ngân đang mở.
- Cash session mở/đóng, tính expected cash từ float + thu tiền mặt - hoàn tiền mặt - chi tiền mặt; ghi chi phí.
- Reports tổng hợp số hóa đơn, doanh số phát hành, tiền đã thu, hoàn tiền, chi phí và thu ròng theo khoảng thời gian.
- Owner UI đã kết nối thu ngân, chính sách thuế, hóa đơn, thanh toán, hoàn tiền, chi phí, đóng ca và báo cáo.
- CI trên commit UI hiện tại: Typecheck, Lint, Unit tests và Production build PASS. P08/P09 vẫn IN PROGRESS vì chưa có runtime/browser smoke test và đối soát nghiệp vụ thực tế.

## P10 + P11 – 2026-11-19
- Dexie schema v5 thêm devices, changeLogs, syncConflicts, syncCursors, backupRecords.
- Thêm đăng ký/duyệt/thu hồi thiết bị, hàng đợi change log chỉ nhận encryptedPayload, cursor và conflict records.
- Thêm protocol đóng gói/mở gói đồng bộ AES-GCM với PBKDF2 và kiểm tra salonId/peerDeviceId. Chưa có kênh WebRTC/signaling hoặc truyền dữ liệu thực tế.
- Thêm backup export AES-GCM 256, PBKDF2 SHA-256 310.000 vòng, checksum SHA-256; restore có merge/replace, xác minh salonId và chặn bản ghi khác tenant.
- Owner UI có màn hình thiết bị/xung đột và backup/restore mã hóa.
- Unit tests xác minh mã hóa, sai mật khẩu, context và peer/salon isolation.
- CI trên commit P10/P11: Typecheck, Lint, Unit tests và Production build PASS. P10/P11 vẫn IN PROGRESS do chưa có transport P2P và kiểm thử backup IndexedDB trên thiết bị thật.
