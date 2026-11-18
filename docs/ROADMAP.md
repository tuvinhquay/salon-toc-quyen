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
