# Phase 39 – Chẩn đoán Firebase env/API key và lỗi Gemini

Ngày: 2026-11-26
Branch: `phase-39-gemini-env-path-diagnostics`
Base: `phase-38-gemini-live-check-and-natural-chat`

## Kết quả rà soát source
- `src/lib/firebase.ts` đọc `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` cùng các cấu hình Firebase Web app từ `import.meta.env`.
- App Check đọc `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
- `src/app/assistant-gemini.ts` khởi tạo `getAI(firebaseApp, { backend: new GoogleAIBackend() })` và gọi model `gemini-3.8-flash`.
- Không có `GEMINI_API_KEY` riêng trong frontend theo kiến trúc hiện tại. Firebase AI Logic SDK dùng Firebase Web app config; không đưa Gemini API key vào client.
- Vite tự nạp `.env.local` từ root project, `VITE_*` được expose vào bundle. `.gitignore` đã loại trừ `.env`, `.env.*`, `*.local`.

## Thay đổi Phase39
- Thêm `firebaseEnvDiagnostics` báo key/site-key presence, project ID và so sánh project `salonquyen-f21fa`; tuyệt đối không trả về giá trị API key.
- Thêm diagnostics trong màn hình Trợ lý: project ID, API key loaded/not loaded, reCAPTCHA loaded/not loaded, App Check state và model.
- Thay thông báo chung bằng mã lỗi và message SDK đã lọc chuỗi có dạng API key/token để Owner gửi lại an toàn.
- Bổ sung typing `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
- Cập nhật CI branch filters, ROADMAP và session notes.

## Runtime check cần Owner thực hiện
- Xác nhận `~/salon-toc-quyen/.env.local` tồn tại và các biến `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` có giá trị.
- Không gửi API key hoặc toàn bộ file env lên chat.
- Restart Vite sau khi sửa env; kiểm tra trạng thái trên trang Trợ lý rồi bấm **Kiểm tra kết nối**.
- CI chưa được xác nhận PASS và Firebase runtime chưa được xác nhận; không merge/deploy.
