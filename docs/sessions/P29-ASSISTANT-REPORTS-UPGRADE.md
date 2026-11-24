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
- Bổ sung biểu đồ cột tiền thu, hoàn tiền và chi phí từ Payment/Refund/Expense; có nút lọc nhanh ngày/tháng/quý/năm và tự đổi bucket ngày/tháng; thêm kiểm thử.
- Bổ sung regression tests cho cách diễn đạt câu hỏi nhân viên và khách mua nhiều sản phẩm.
- Giữ nguyên tenant scope: mọi dữ liệu lấy từ IndexedDB theo salonId hiện tại. Không gửi hồ sơ nhân viên hoặc dữ liệu khách hàng lên Gemini qua luồng tra cứu này.

## Giới hạn dữ liệu cần xử lý ở phần tiếp theo
- Thành tích nhân viên hiện chỉ xác minh được ca làm hoàn thành và số giờ ghi nhận. Chưa có employeeId/performer attribution gắn với từng dòng dịch vụ hoặc hóa đơn, nên chưa thể báo cáo doanh thu cá nhân, số khách phục vụ hay doanh số bán hàng. Không tự tạo số liệu.
- Chat chỉ hỗ trợ lưu trữ khách hàng theo tên/số điện thoại hoặc tất cả khách hàng sau preview và xác nhận; chưa cho bot tự tạo/sửa sản phẩm hay hồ sơ. Các thao tác thêm/sửa/nhóm/trường thực hiện trong màn hình quản lý.
- Bổ sung Dexie v7 cho nhóm khách hàng; Owner có thể tạo/sửa/lưu trữ nhóm theo tháng/quý/tùy chỉnh, gắn nhóm vào hồ sơ khách hàng.
- Bổ sung custom fields thật trên Customer và Product (lưu trong record, không giả lập bằng notes); cho phép thêm/sửa/xóa từng trường trong form.
- Bổ sung sửa sản phẩm, đổi danh mục dạng văn bản tự do và ngừng/kích hoạt kinh doanh mà không xóa lịch sử hóa đơn/tồn kho.
- Bổ sung chọn nhiều khách hàng và lưu trữ hàng loạt có kiểm tra tenant, transaction và audit; bot chat cũng có thể lập danh sách xem trước, chỉ lưu trữ sau câu xác nhận rõ ràng.
- Nâng backup mã hóa lên schema v7, gồm customerGroups và assistantMemories; restore backup cũ chỉ thay các bảng có trong tệp để không xóa bảng mới chưa có trong backup cũ.
- Chưa tích hợp thêm sản phẩm trực tiếp bằng câu chat; người dùng vẫn thêm sản phẩm qua module Kho hiện có.
- Gemini chưa được thay đổi cấu hình hoặc kiểm thử trong phase này; vẫn là bước sau khi Owner chấp thuận.

## Bảo mật và dữ liệu
- Không thay đổi Firestore Rules, Firebase project, Firebase Auth, Membership hoặc dữ liệu salon.
- Dexie được nâng từ v6 lên v7 để bổ sung customerGroups; các Customer/Product cũ giữ tương thích vì groupIds/customFields là trường tùy chọn.
- Thao tác archive/update chỉ thực hiện qua repository có kiểm tra salonId, xác nhận rõ ràng và audit; không hard-delete hóa đơn/thanh toán.
- Không merge PR, không deploy Firebase Hosting/Rules.
- Không đưa dữ liệu cá nhân vào Gemini trong luồng tra cứu hồ sơ nhân viên.

## Kiểm thử
- GitHub Actions run 45420082379: PASS – Typecheck, ESLint, 50 unit tests, Production build/PWA.
- Cần đồng bộ branch trên Termux và smoke test Android với dữ liệu thật: tạo nhóm tháng/quý, thêm trường khách/sản phẩm, gán nhân viên khi lập hóa đơn, hỏi bot hồ sơ nhân viên/khách chi tiêu, thử lưu trữ qua chat và đối chiếu biểu đồ thu/hoàn/chi.
- Không đánh dấu Phase 29 PASS cho tới khi CI và kiểm tra runtime đều đạt.

## Definition of Done còn lại
1. Hoàn tất employee attribution trong workflow/POS, có migration và kiểm thử hồi quy.
2. Quản lý customer groups và custom fields có schema/repository/UI CRUD.
3. Luồng bot ghi/xóa an toàn: preview + xác nhận + audit + tenant isolation.
4. Biểu đồ được đối chiếu với báo cáo tài chính theo cùng khoảng thời gian.
5. Gemini chỉ được kiểm thử ở phase kế tiếp sau khi Owner xác nhận.
