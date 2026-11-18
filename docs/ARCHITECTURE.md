# Kiến trúc

- React + TypeScript + Vite + Tailwind; TanStack Query/Router.
- Dexie/IndexedDB lưu nghiệp vụ tại thiết bị.
- Firebase Auth/Firestore chỉ quản lý danh tính, workspace, membership, quyền, thiết bị, signaling và metadata backup.
- Không lưu khách hàng, lịch hẹn, hóa đơn, công thức tóc hoặc dữ liệu kho dạng rõ trong Firestore.
- Gemini gọi từ server; secret không đưa xuống client.
- Luồng: Owner UI -> application service -> validation -> Dexie transaction -> change log/outbox -> thiết bị đã duyệt.
- Client không tự quyết định role. Rules/server kiểm tra membership, role và thiết bị.
- Owner bootstrap phải chống first-visitor takeover.
- WebRTC có thể cần TURN; thiết bị offline không nhận thu hồi tức thời. Backup ciphertext cloud mặc định tắt.
