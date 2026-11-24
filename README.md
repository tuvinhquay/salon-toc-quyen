# Salon TÓC QUYỀN

Owner-first salon management PWA. Giai đoạn hiện tại triển khai giao diện và nghiệp vụ dành cho Owner.

## Stack
React 19, TypeScript strict, Vite, Tailwind CSS, TanStack, Dexie/IndexedDB, Firebase Authentication, Firestore metadata, Firebase AI Logic (Gemini tùy chọn), PWA.

## Local development
```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Kiến trúc hiện tại
- Chủ tiệm đăng nhập bằng Google cá nhân; lần đầu có thể tạo salon riêng.
- Firestore Rules yêu cầu salon và membership được tạo trong cùng một batch, gắn với UID Google đang đăng nhập. Client không thể tự đổi role hoặc ghi đè membership.
- Dữ liệu kinh doanh và trí nhớ trợ lý lưu local-first trong IndexedDB theo salonId + Owner UID; chưa đồng bộ đa thiết bị.
- Trợ lý nội bộ xử lý nghiệp vụ tại thiết bị. Gemini là cố vấn tùy chọn qua Firebase AI Logic và App Check; không nhúng API key vào frontend.
- Ứng dụng không sử dụng Cloud Functions.

## Kiểm tra
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Xem [ROADMAP](docs/ROADMAP.md), [hướng dẫn triển khai](docs/DEPLOYMENT.md) và [lịch sử phiên](docs/sessions/LICH_SU_PHIEN_LAM_VIEC.md).
