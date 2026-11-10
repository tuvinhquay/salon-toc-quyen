# Salon TÓC QUYỀN

Owner-first salon management PWA. Giai đoạn hiện tại chỉ triển khai giao diện và backend dành cho Owner; Employee App chưa thuộc phạm vi.

## Stack
React 19, TypeScript strict, Vite, Tailwind CSS, TanStack, Dexie/IndexedDB, Firebase Auth/Firestore metadata, PWA.

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

Không điền Gemini secret vào frontend. Gemini chỉ được tích hợp ở server runtime khi có cấu hình secret an toàn.

## Trạng thái
P01 foundation đang triển khai; chưa nghiệm thu build/test. Xem [ROADMAP](docs/ROADMAP.md) và [lịch sử phiên](docs/sessions/LICH_SU_PHIEN_LAM_VIEC.md).
