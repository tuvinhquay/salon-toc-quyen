# Salon TÓC QUYỀN

Owner-first salon management PWA. Giai đoạn hiện tại chỉ triển khai giao diện và backend dành cho Owner; Employee App chưa thuộc phạm vi.

## Stack
React 19, TypeScript strict, Vite, Tailwind CSS, TanStack, Dexie/IndexedDB, Firebase Auth/Firestore metadata, PWA.

## Local development
```bash
npm ci
cp .env.example .env.local
npm run dev
```

Không điền Gemini secret vào frontend. Gemini chỉ được tích hợp ở server runtime khi có cấu hình secret an toàn.

## Trạng thái hiện tại
- P01 foundation: IN PROGRESS; CI production trên GitHub Actions đã PASS.
- Các bước CI: `npm ci`, typecheck, lint, unit tests và production PWA build.
- Kiểm thử Termux ngày 2026-11-18: typecheck, lint, tests và production build đều PASS theo kết quả người dùng cung cấp.
- Chưa nghiệm thu toàn phần: còn rà soát cảnh báo dependency security và kiểm tra giao diện/PWA trên trình duyệt thực tế.

Xem [ROADMAP](docs/ROADMAP.md) và [lịch sử phiên](docs/sessions/LICH_SU_PHIEN_LAM_VIEC.md).
