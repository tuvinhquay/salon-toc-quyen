# ROADMAP – Salon TÓC QUYỀN
Phạm vi giai đoạn 1: Owner App. Employee App là giai đoạn 2, không trộn giao diện nhân viên trước khi Owner nghiệm thu.
| ID | Hạng mục | Trạng thái |
|---|---|---|
| P01 | Repository, cấu trúc, UI shell | IN PROGRESS |
| P02 | Firebase Auth, Owner membership, Rules | IN PROGRESS |
| P03 | Dexie schema, migration, validation | IN PROGRESS |
| P04 | Khách hàng và lịch hẹn | IN PROGRESS |
| P05 | Dịch vụ, công thức, workflow event log | IN PROGRESS |
| P06 | Nhân viên, ca làm, quyền, hoa hồng | NOT STARTED |
| P07 | Kho, lô, vật tư tiêu hao | NOT STARTED |
| P08 | POS, hóa đơn, thanh toán, thuế | NOT STARTED |
| P09 | Dashboard và báo cáo | NOT STARTED |
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
