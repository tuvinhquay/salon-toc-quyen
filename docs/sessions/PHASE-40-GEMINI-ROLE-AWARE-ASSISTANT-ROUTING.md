# Phase 40 – Gemini role-aware assistant routing

## Mục tiêu
Gemini cần là trợ lý hội thoại và cố vấn thực sự, kết hợp an toàn với bộ máy dữ liệu salon; không chỉ là bot trả lời câu hỏi chung. Việc phân quyền do ứng dụng/Firebase AuthGate quyết định, không giao cho model.

## Luồng xử lý
- Chat/sáng tác/general: gửi câu hỏi trực tiếp đến Firebase AI Logic, không đọc IndexedDB, dữ liệu salon hoặc trí nhớ local trước đó.
- Nghiệp vụ: đọc dữ liệu local theo salonId và trả kết quả bằng bộ máy nghiệp vụ; không gọi Gemini trừ khi câu hỏi có ý tư vấn/phân tích.
- Hybrid: bộ máy local tính toán trước; Gemini chỉ nhận số liệu tổng hợp không định danh cùng câu hỏi đã lọc.
- Hướng dẫn app và các lệnh ghi dữ liệu đã xác nhận vẫn đi theo xử lý local hiện hữu.

## Timeout và chẩn đoán
- Probe: 15 giây; tư vấn: 25 giây; chat: 30 giây.
- Lỗi Gemini được redaction và hiển thị thông báo cụ thể; local fallback không mất dữ liệu.
- Phân biệt Firebase Web API key với Gemini API key trong giao diện diagnostics.

## Quyền và bảo mật
- Owner Assistant chỉ xuất hiện sau AuthGate xác minh Firebase membership active, role owner và salonId hợp lệ.
- Gemini chỉ nhận role context OWNER từ đường gọi đã bảo vệ; model không tự quyết định membership, salon scope hay quyền truy cập.
- Chat thường che email/số điện thoại dạng rõ ràng mà không cần đọc database.
- Hybrid chỉ gửi aggregate context; không gửi hồ sơ, tên, điện thoại, email khách hàng/nhân viên; Gemini không có quyền ghi dữ liệu.
- Employee App/Auth/Membership chưa được triển khai. Không cấp Employee AI bằng cách suy đoán từ bảng Employee; cần thiết kế membership xác thực riêng và quyền dữ liệu riêng trước khi bật.

## Kiểm thử
- Unit tests định tuyến chat/local/hybrid và redaction email/phone/prompt length.
- Cần CI typecheck, lint, tests, production build và Owner live acceptance trên Termux/Android.
- Acceptance bắt buộc: chat thơ qua Gemini; tra cứu nghiệp vụ local; tư vấn hybrid; Gemini unavailable/timeout; App Check; xác minh không rò PII và không thay đổi tenant/auth.

## Trạng thái
IMPLEMENTED ON BRANCH – chưa có kết quả CI/live acceptance; chưa merge, chưa deploy.
