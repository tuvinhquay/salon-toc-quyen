# Phase 38 – Kiểm tra kết nối Gemini thực tế & trò chuyện tự nhiên hơn

Ngày: 2026-11-26
Branch: `phase-38-gemini-live-check-and-natural-chat`
Base: `phase-37-owner-guide-and-assistant-knowledge`

## Rà soát hiện trạng
- Trợ lý đã có tích hợp Firebase AI Logic SDK qua `firebase/ai`, dùng `GoogleAIBackend` và model `gemini-3.8-flash`.
- Gemini chỉ được gọi cho câu hỏi tư vấn/chưa nhận diện; hướng dẫn, tra cứu và phép tính nghiệp vụ vẫn xử lý local để tiết kiệm hạn mức.
- Trước Phase38, nhãn “đã kết nối” chỉ dựa vào việc có Firebase config + App Check. Điều đó chỉ chứng minh đã cấu hình, không chứng minh model API đang trả lời thật.
- Ứng dụng không nhúng Gemini API key; kết nối thông qua Firebase AI Logic proxy. App Check được khởi tạo bằng reCAPTCHA Enterprise config.

## Thay đổi
- Thêm `testGeminiConnection()`: thực hiện một yêu cầu thật, ngắn, giới hạn output thấp tới model hiện tại. Đây là phép thử thủ công do Owner bấm, không chạy tự động mỗi lần mở app và không gọi API liên tục.
- Giao diện phân biệt “Gemini đã cấu hình” với “Gemini đã phản hồi thành công”; bổ sung nút **Kiểm tra kết nối**.
- Khi kiểm tra thất bại, hiển thị hướng xử lý thân thiện cho thiếu cấu hình, App Check/quyền, lỗi mạng và hạn mức 429/quota.
- Cải thiện prompt Gemini: giọng trò chuyện tự nhiên, xưng em – anh/chị, ít gạch đầu dòng, không lặp câu hỏi, chỉ hỏi lại một câu khi thực sự thiếu dữ kiện; giữ nguyên nguyên tắc không bịa số liệu và không tự thực hiện thao tác.
- Tăng nhẹ độ tự nhiên của câu trả lời, giới hạn output thấp hơn để tiết kiệm tokens.
- CI được bổ sung branch Phase38.

## Hạn chế / Owner runtime acceptance
- CI không thể chứng minh Gemini API trên Firebase project của Owner đã bật hoặc App Check token thật hoạt động. Chỉ nút **Kiểm tra kết nối** trên app đang chạy mới xác minh được luồng Firebase AI Logic → Gemini.
- Trước khi thử, cần Firebase Console > AI Services > AI Logic bật Gemini Developer API + Firebase AI Logic API; App Check reCAPTCHA Enterprise phải đăng ký đúng app/site key.
- Gemini Developer API Free Tier không có một con số “1 triệu token/ngày” đảm bảo chung cho mọi project/model. Hạn mức thực tế theo model/project (requests/minute, tokens/minute, requests/day) và xem trong AI Studio/Google Cloud. Hãy xem con số của project hiện tại.
- Không merge/deploy. Chờ CI và Owner kiểm tra thực tế trên Android/Termux.



## Follow-up – ngữ cảnh hội thoại
- Gemini nhận tối đa 3 câu hỏi gần nhất của chính người dùng để hiểu câu hỏi nối tiếp như “còn tháng trước thì sao?”.
- Mỗi câu hỏi được chạy qua hàm lọc tên khách/nhân viên, email và số điện thoại; mỗi câu hỏi giới hạn 300 ký tự, toàn bộ ngữ cảnh tối đa 900 ký tự.
- Không gửi lại các câu trả lời local trước đó vì có thể chứa hồ sơ khách hàng hoặc dữ liệu riêng tư.
