# Lịch sử phiên làm việc
Các phiên 01–05 được giữ nguyên ở các commit lịch sử trước đó.
## Phiên 06 – 2026-11-18 – Gộp P04 + P05
### Đã triển khai trên phase-04-05-customers-appointments-workflow
- Dexie schema version 2, migration giữ nguyên version 1, store workflowEvents.
- Repository local-first khách hàng, lịch hẹn, dịch vụ, workflow event.
- Kiểm tra salon scope ở các điểm truy cập; audit event ghi cùng transaction.
- State transition lịch hẹn; tiền cọc; snapshot khách hàng tại thời điểm đặt.
- Công thức tóc được lưu thành snapshot append-only.
- Bổ sung kiểm thử validation cho customer, appointment, service, formula và workflow.
### Chưa hoàn tất
- Chưa có UI CRUD nghiệp vụ; chưa có IndexedDB integration test trên trình duyệt.
- Chưa xác minh Firebase membership live để cấp ActorContext.
- Chưa có nhân viên, kho, P2P/cloud sync.
### Trạng thái
P04 + P05 IN PROGRESS; chưa được đánh dấu PASS.
