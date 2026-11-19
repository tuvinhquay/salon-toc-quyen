# Security model

- Không commit secret, token, private key hoặc .env.
- Gemini API key chỉ server-side; không dùng tiền tố VITE_.
- Firebase Rules mặc định từ chối; kiểm tra auth, membership, role và device.
- Không tin role/salonId do client gửi nếu chưa đối chiếu.
- Owner bootstrap phải xác minh quyền sở hữu.
- Không log khóa hoặc dữ liệu nhạy cảm.
- Ảnh/ghi chú nhạy cảm cần consent.
- Thu hồi thiết bị không xóa được dữ liệu đã giải mã trên thiết bị offline; cần key rotation.
- Repository đang Public: tuyệt đối không đưa secret vào Git.

## Mã hóa backup và sync (P10/P11)
- Dùng Web Crypto AES-GCM 256-bit, PBKDF2 SHA-256 với 310.000 iterations, salt 16 bytes và IV 12 bytes ngẫu nhiên.
- Context binding tách biệt backup và sync; SHA-256 checksum phát hiện file bị thay đổi trước giải mã.
- Passphrase không được lưu hoặc gửi lên Firebase. Quên passphrase đồng nghĩa không thể giải mã backup.
- Restore chỉ nhận payload có salonId khớp Owner context; replace yêu cầu xác nhận rõ ràng và chỉ xóa record thuộc salon hiện tại.
- P2P/WebRTC transport và signaling chưa được triển khai; chưa có dữ liệu nghiệp vụ được truyền giữa thiết bị trong giai đoạn này.

## AI endpoint security (P12)
- Gemini API key chỉ được bind vào Cloud Function qua Firebase Secret Manager; không xuất hiện trong bundle Vite.
- salonAssistant yêu cầu Firebase Auth, App Check và membership active/owner; rate limit 10 requests/phút/UID.
- Prompt/context giới hạn độ dài, không lưu Firestore và không ghi log. Function chỉ nhận nội dung người dùng chủ động gửi, không tự đọc dữ liệu salon.
- Khi chưa cấu hình reCAPTCHA Enterprise site key, UI khóa gọi AI; fail closed.
