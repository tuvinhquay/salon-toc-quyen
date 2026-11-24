# Phase 29 – Trợ lý nghiệp vụ và báo cáo trực quan

Ngày: 2026-11-24  
Branch: `phase-29-assistant-natural-language-and-configurable-analytics`  
Base: `phase-28-tenant-isolation-handover-v2`

## Đã triển khai trên branch
- Mở rộng nhận diện câu hỏi nhân viên theo tên/số điện thoại; khi khớp duy nhất, bot trả hồ sơ, vị trí, trạng thái, ngày vào làm, thâm niên ước tính và ca làm đã hoàn thành.
- Không gửi câu hỏi tra cứu hồ sơ nhân viên lên Gemini; tra cứu cá nhân ở local-only.
- Khi không tìm thấy hồ sơ nhân viên khớp duy nhất, bot yêu cầu kiểm tra lại thay vì tự chọn người gần giống.
- Bổ sung thống kê khách hàng theo số lịch đặt và theo chi tiêu hóa đơn; có thể xếp hạng theo số lượng sản phẩm mua khi câu hỏi yêu cầu rõ.
- Chỉnh lời chào thành giọng trợ lý “em – anh/chị”, sử dụng tên hiển thị Google nếu có; không lấy email làm tên.
- Bổ sung cơ chế học từ vựng do Owner dạy bằng câu “Hãy ghi nhớ từ … nghĩa là …”; những câu hỏi sau sẽ được thay thế alias trước khi nhận diện intent, dữ liệu học vẫn lưu local-only theo salonId + ownerId.
- FAQ giải thích rõ trợ lý cơ sở có giới hạn, khuyến khích câu hỏi ngắn; phân biệt chức năng chat chỉ đọc với CRUD trong màn hình quản lý.
- Bổ sung biểu đồ cột thu/chi thực tế từ Payment và Expense, tự đổi ngày/tháng theo khoảng thời gian; thêm kiểm thử cho bucket theo ngày, tháng và ngày kết thúc.
- Bổ sung regression tests cho cách diễn đạt câu hỏi nhân viên và khách mua nhiều sản phẩm.
- Giữ nguyên tenant scope: mọi dữ liệu lấy từ IndexedDB theo salonId hiện tại. Không gửi hồ sơ nhân viên hoặc dữ liệu khách hàng lên Gemini qua luồng tra cứu này.

## Giới hạn dữ liệu cần xử lý ở phần tiếp theo
- Thành tích nhân viên hiện chỉ xác minh được ca làm hoàn thành và số giờ ghi nhận. Chưa có employeeId/performer attribution gắn với từng dòng dịch vụ hoặc hóa đơn, nên chưa thể báo cáo doanh thu cá nhân, số khách phục vụ hay doanh số bán hàng. Không tự tạo số liệu.
- Chưa triển khai thao tác ghi/xóa dữ liệu qua chat. Bot hiện vẫn chỉ đọc và phân tích; yêu cầu xóa hàng loạt cần luồng xác nhận, preview số bản ghi và audit transaction trước khi bật.
- Chưa triển khai màn hình quản trị nhóm khách hàng và custom fields. Không dùng mock data hoặc lưu tạm vào notes thay cho schema thật.
- Chưa tích hợp thêm sản phẩm trực tiếp bằng câu chat; người dùng vẫn thêm sản phẩm qua module Kho hiện có.
- Gemini chưa được thay đổi cấu hình hoặc kiểm thử trong phase này; vẫn là bước sau khi Owner chấp thuận.

## Bảo mật và dữ liệu
- Không thay đổi Firestore Rules, Firebase project, Firebase Auth, Membership hoặc dữ liệu salon.
- Không đổi IndexedDB schema và không chạy migration.
- Không tự xóa hoặc sửa dữ liệu kinh doanh.
- Không merge PR, không deploy Firebase Hosting/Rules.
- Không đưa dữ liệu cá nhân vào Gemini trong luồng tra cứu hồ sơ nhân viên.

## Kiểm thử
- Đã bổ sung unit tests cho cách diễn đạt và biểu đồ; cần GitHub Actions xác nhận typecheck, lint, tests và production build.
- Cần đồng bộ branch trên Termux, chạy typecheck/lint/test/build và smoke test trên Android với hồ sơ nhân viên thật, dữ liệu khách hàng thật đã được nhập và báo cáo thu/chi.
- Không đánh dấu Phase 29 PASS cho tới khi CI và kiểm tra runtime đều đạt.

## Definition of Done còn lại
1. Hoàn tất employee attribution trong workflow/POS, có migration và kiểm thử hồi quy.
2. Quản lý customer groups và custom fields có schema/repository/UI CRUD.
3. Luồng bot ghi/xóa an toàn: preview + xác nhận + audit + tenant isolation.
4. Biểu đồ được đối chiếu với báo cáo tài chính theo cùng khoảng thời gian.
5. Gemini chỉ được kiểm thử ở phase kế tiếp sau khi Owner xác nhận.
