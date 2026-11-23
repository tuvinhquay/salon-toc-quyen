# P21 – Gemini cố vấn qua Firebase AI Logic

Ngày: 2026-11-23  
Nhánh: `phase-19-local-learning-assistant`

## Thiết kế và triển khai trên nhánh
- Dùng Firebase AI Logic Web SDK với Gemini Developer API, model `gemini-3.8-flash`.
- Không dùng Cloud Functions, không đặt Gemini API key trong frontend, không chuyển Firebase project sang Blaze.
- Gemini chỉ được gọi khi câu hỏi cần tư vấn/giải thích/đề xuất hoặc bộ nhận diện local chưa hiểu.
- Số liệu tiền được tính trước bằng TypeScript; Gemini chỉ giải thích và tư vấn, không được tự tính lại hoặc tạo số liệu.
- Chỉ gửi số liệu tổng hợp đã loại bỏ tên, số điện thoại, email, ghi chú, công thức tóc, dòng hóa đơn và mã thanh toán. Câu hỏi được lọc email, số điện thoại và tên khách/nhân viên/khách snapshot đã có trong dữ liệu local; tên tự do ngoài hồ sơ không thể đảm bảo nhận diện tuyệt đối, vì vậy UI nhắc người dùng không nhập PII.
- Nếu AI Logic/App Check chưa sẵn sàng, Gemini lỗi hoặc hết hạn mức, trợ lý local vẫn trả lời.
- App Check hiện được lấy từ cấu hình Firebase hiện có; thiếu App Check thì tắt Gemini, không tắt trợ lý nội bộ.

## Điều kiện cần thực hiện tại Firebase Console
1. Mở Firebase Console của project salonquyen-f21fa.
2. Vào AI Services → AI Logic → Get started.
3. Chọn Gemini Developer API (không chọn Agent Platform/Vertex AI yêu cầu billing).
4. Xác nhận App Check được bật/enforced cho Firebase AI Logic và cấu hình provider phù hợp cho Web app.
5. Kiểm tra model Free Tier, quota và điều khoản dữ liệu trước khi cho người dùng thật sử dụng.

## Lưu ý quyền riêng tư
Google nêu nội dung gửi qua Gemini Developer API Free Tier có thể được dùng để cải thiện sản phẩm. Dù ứng dụng chỉ gửi số liệu tổng hợp, cần cân nhắc điều khoản này trước khi bật. Không gửi PII hoặc hồ sơ khách hàng/nhân viên.

## Trạng thái
CODE IMPLEMENTED – chưa kích hoạt AI Logic/App Check trên Firebase project và chưa smoke test live. Không tuyên bố Gemini đã hoạt động cho tới khi kiểm thử thành công.
