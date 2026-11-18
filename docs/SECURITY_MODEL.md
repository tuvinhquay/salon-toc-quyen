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
