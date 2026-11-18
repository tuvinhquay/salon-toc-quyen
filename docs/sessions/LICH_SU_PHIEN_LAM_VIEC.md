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

## Phiên 07 – 2026-11-19 – Kết nối UI nghiệp vụ P04 + P05
### Đã thực hiện
- Bổ sung OwnerContext; ActorContext chỉ hình thành sau khi AuthGate xác minh membership active, role owner và salonId hợp lệ.
- Xây dựng UI quản lý khách hàng: tạo, tìm kiếm, sửa và lưu trữ hồ sơ; dữ liệu đọc/ghi qua Dexie repository.
- Xây dựng UI quản lý dịch vụ: tạo, sửa, xem danh sách; giá VND và thời lượng được kiểm tra bằng schema.
- Xây dựng UI lịch hẹn: chọn khách hàng và dịch vụ, chọn thời gian bắt đầu/kết thúc, ghi nhận tiền cọc và cập nhật trạng thái theo transition map.
- Xây dựng UI nhật ký quy trình: ghi nhận tư vấn/công đoạn và lưu snapshot công thức tóc.
- Bổ sung style responsive cho màn hình nghiệp vụ và điều hướng hiển thị danh tính Owner.
### Sửa lỗi trong kiểm thử
- CI đầu tiên phát hiện import nhầm WorkflowEventInput từ db/types; đã sửa để import type từ db/schema.
- Các lần CI sau sửa đã xác nhận Typecheck và Lint PASS; Unit tests/Production build đang chờ kết quả cuối.
### Còn tồn tại / chưa nghiệm thu
- Chưa chạy UI trên trình duyệt thực tế hoặc Termux của người dùng; chưa có IndexedDB integration test tự động.
- Chưa kiểm thử multi-tenant bằng hai salon khác nhau, không đồng bộ cloud, không mã hóa local DB và chưa backup.
- Chưa có chức năng sửa/xóa mềm lịch hẹn, hoàn tiền cọc hoặc xử lý xung đột đồng bộ.
- P04 + P05 vẫn IN PROGRESS, không đánh dấu PASS cho tới khi CI đầy đủ và runtime regression được xác nhận.

### Bổ sung sau rà soát regression
- Bắt gặp lỗi escape regex trong chuẩn hóa số điện thoại/tên tiếng Việt của repository; đã sửa và thêm unit test riêng cho hai trường hợp.
- Đã bổ sung tìm kiếm hồ sơ khách hàng theo tên/số điện thoại.
- CI trên commit trước đó đã PASS đầy đủ; commit sửa chuẩn hóa và test mới đang được xác minh lại.

## Phiên 08 – 2026-11-19 – Gộp P06 + P07
### Đã triển khai
- Dexie schema version 3: thêm employee, shift, commission, product, supplier, purchase order, inventory lot và stock movement; giữ nguyên version 1 và 2.
- Schema Zod cho hồ sơ nhân viên, ca làm, chính sách hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Repository P06: tạo/list nhân viên; tạo/list ca làm; ngăn ca trùng giờ trên cùng nhân viên; lưu chính sách hoa hồng theo nhân viên/dịch vụ hoặc toàn salon.
- Repository P07: tạo/list sản phẩm, nhà cung cấp; tạo đơn mua hàng; nhận hàng một phần/toàn phần; tạo inventory lot và stock movement, cập nhật trạng thái đơn trong cùng Dexie transaction.
- UI Owner: quản lý nhân viên, xếp ca, cấu hình hoa hồng; tạo sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Bổ sung unit tests schema cho employee, shift, commission, product, supplier, purchase order và receive batch.
### Giới hạn còn lại
- Chưa có IndexedDB integration test/browser smoke test; chưa kiểm tra UI thực tế trên Termux/Android.
- Chưa có phân quyền chi tiết theo nhân viên, tính hoa hồng thực thu, tiêu hao vật tư, điều chỉnh tồn, trả hàng hoặc kiểm kê.
- Chưa có tự động cảnh báo/đổi trạng thái lô hết hạn; cần hoàn thiện FIFO/FEFO và xác nhận nghiệp vụ.
- P06 + P07 IN PROGRESS; chỉ đánh dấu PASS sau CI và runtime regression đầy đủ.
