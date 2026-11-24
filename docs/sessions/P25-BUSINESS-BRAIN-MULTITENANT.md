# P25 – Business Brain và Tenant riêng cho từng chủ salon
Ngày: 2026-11-24
Branch: `phase-25-business-brain-multitenant`
Base: `phase-24-assistant-clean-chat-google-switch`

## Mục tiêu
Định hướng trợ lý theo mô hình tra cứu dữ liệu, tính toán nghiệp vụ, phân tích đối chiếu và câu hỏi mẫu do từng chủ salon tự dạy. Đồng thời cho phép mỗi Google account chưa có membership tạo một tenant salon độc lập.

## Trợ lý nghiệp vụ
- Mở rộng nhận diện câu hỏi tiếng Việt cho doanh thu, tiền thu, tiền hoàn, chi phí, lịch hẹn, khách hàng, dịch vụ, nhân viên, tồn kho và tìm sản phẩm.
- Thêm báo cáo theo quý (Asia/Ho_Chi_Minh), bên cạnh hôm nay, tháng và năm.
- Tổng hợp tình hình gồm doanh thu hóa đơn, tiền đã thu, hoàn tiền, chi phí, thu ròng, lịch hẹn, dịch vụ, khách hàng và cảnh báo tồn kho.
- Tìm sản phẩm theo tên/SKU/danh mục trong kho của tenant hiện tại và hiển thị tồn khả dụng.
- Xếp hạng nhân viên theo tổng giờ ca làm đã hoàn thành, chỉ khi có dữ liệu WorkShift. Không gọi đây là doanh thu hoặc năng suất dịch vụ; dữ liệu lịch hẹn/hóa đơn chưa có nhân viên thực hiện.
- Trả lời cục bộ các câu hỏi “Bạn có thể làm được gì?” và “Ai đã tạo ra bạn?” mà không phụ thuộc Gemini.
- Gemini tiếp tục là cố vấn tùy chọn; kết quả tài chính do mã nghiệp vụ tính, không để mô hình tự tạo số liệu.

## Chủ tiệm tự dạy câu hỏi
- Thêm category `shortcut` cho trí nhớ AI.
- Cú pháp ví dụ: `Hãy ghi nhớ thêm. Tổng hợp danh sách nhân viên xuất sắc tháng này`.
- Câu hỏi tương tự như `Nhân viên nào làm việc tốt nhất tháng này?` được so khớp với shortcut đã dạy và chạy truy vấn nghiệp vụ tương ứng.
- Shortcut lưu trong IndexedDB, gắn cả `salonId` và `ownerId`; mỗi chủ tự quản lý trí nhớ riêng.
- Có thể lưu trữ (archive) shortcut trong danh sách trí nhớ hiện có.
- Shortcut đã dạy được ưu tiên trả lời cục bộ, không chờ Gemini.

## Mô hình multi-tenant
- Một Google UID chỉ được tạo một tenant salon riêng qua callable Cloud Function `createOwnerSalon`.
- Function yêu cầu Firebase Authentication, kiểm tra membership trong transaction; nếu đã có membership active thì trả về tenant hiện tại, không tạo tenant thứ hai.
- Chỉ Admin SDK tạo `salons/{salonId}` và `memberships/{uid}`; trình duyệt không được tự ghi membership.
- `AuthGate` cho tài khoản mới tạo salon riêng và chỉ render ứng dụng sau khi đọc lại membership active/owner.
- Mỗi bản ghi IndexedDB hiện có `salonId`; các truy vấn nghiệp vụ và backup lọc theo salonId. Trí nhớ còn lọc theo cả salonId và ownerId.
- Firestore Rules vẫn cấm client ghi membership/salon metadata; owner chỉ đọc được metadata salon thuộc membership của mình.
- Tài khoản có membership tồn tại nhưng sai role/status không được phép tự tạo tenant mới; cần quản trị viên xử lý.

## Giới hạn cần xử lý trong phase tiếp theo
- Doanh thu cá nhân/nhân viên thực hiện chưa thể tính chính xác cho đến khi thêm employee attribution vào dòng dịch vụ/hóa đơn và luồng POS.
- Trí nhớ và dữ liệu nghiệp vụ hiện vẫn ở IndexedDB trên từng thiết bị; multi-tenant đã phân vùng cục bộ nhưng chưa có đồng bộ cloud/P2P giữa các thiết bị.
- Callable function mới cần được deploy lên Firebase project `salonquyen-f21fa` trước khi nút tạo salon mới hoạt động trên production.
- Chưa triển khai invitation/membership cho nhiều nhân viên cùng truy cập một salon. Phase này là một owner UID – một tenant riêng.

## Kiểm thử
- GitHub Actions run `45335989842` trên commit `7b6fee75e8fbdda7da1bea19fd2eeaae840c3e74`: Typecheck PASS, ESLint PASS, Unit tests PASS, Production/PWA build PASS, Cloud Functions dependency install PASS và Functions build PASS.
- Các lần CI trước đó phát hiện ký tự xuống dòng bị escape trong test; đã sửa và lượt kiểm tra cuối cùng PASS.

## Kiểm thử dự kiến
- Typecheck, lint, unit tests, production/PWA build và Cloud Functions build qua GitHub Actions.
- Unit tests: câu hỏi tự nhiên, shortcut được dạy, creator/capability FAQ, quý và biên ngày Việt Nam.
- Cần kiểm thử thật bằng hai Google accounts: mỗi account tạo salon riêng, kiểm tra hai salonId khác nhau, dữ liệu/trí nhớ không nhìn thấy chéo.
- Không đánh dấu runtime PASS trước khi callable và Firestore Rules được deploy, rồi kiểm thử trên Android.

## An toàn dữ liệu
- Không xóa hoặc migrate dữ liệu salon đang tồn tại.
- Không thay đổi membership hiện tại của `hoananhtien1@gmail.com`.
- Không tự tạo tenant cho tài khoản hiện tại.
- Không nới lỏng quyền đọc/ghi dữ liệu kinh doanh trên Firestore.
