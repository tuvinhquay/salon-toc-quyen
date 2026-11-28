# Phase 43 – Chuyển trợ lý sang Gemini 3.5 Flash-Lite

Ngày: 2026-11-28

## Lý do
- Người dùng thử trực tiếp model `gemini-3.8-flash` từ Termux; Google trả HTTP 503 UNAVAILABLE với thông báo model đang có nhu cầu cao.
- Người dùng thử `gemini-3.5-flash-lite` bằng cùng API key trong `.env.local`; Google trả HTTP 200, có nội dung tiếng Việt và modelVersion đúng là `gemini-3.5-flash-lite`.

## Thay đổi
- Tạo branch `phase-43-gemini-model-flash-lite` từ `phase-42-fix-vitest-appcheck-dom-isolation`.
- Đổi model đồng bộ ở Vite local proxy (`vite.config.ts`) và cấu hình chẩn đoán UI (`src/app/assistant-gemini.ts`) sang `gemini-3.5-flash-lite`.
- Cập nhật unit test để khóa đúng model mới.
- Không thay API key, endpoint, prompt, timeout, retry, giới hạn proxy, Firebase Auth, Firestore, App Check, Dexie, quyền Owner hay luồng local assistant.
- Không đưa API key vào mã nguồn hoặc biến môi trường VITE_.

## Bằng chứng đã có
- Termux gọi trực tiếp Google Gemini Developer API với model `gemini-3.5-flash-lite`: HTTP 200, SUCCESS, có câu trả lời tiếng Việt, modelVersion `gemini-3.5-flash-lite`.
- Model `gemini-3.8-flash` trả HTTP 503 trong lần thử trước.

## Kiểm tra còn bắt buộc
1. Trên Termux: cập nhật branch, chạy typecheck, lint, test, build.
2. Khởi động lại Vite để nạp cấu hình proxy mới.
3. Gọi endpoint proxy status và POST trực tiếp từ Termux; xác nhận proxy báo đúng model và trả HTTP 200.
4. Chỉ sau khi proxy smoke test thành công mới mở app để kiểm tra sâu: nút kiểm tra kết nối, hội thoại thường, tư vấn có context tổng hợp, định tuyến local và quyền Owner.
5. Chờ CI và review trước khi merge; không deploy.

## Trạng thái
MODEL SWITCH IMPLEMENTED ON BRANCH – DIRECT API LIVE TEST PASS; PROXY / CI / APP ACCEPTANCE PENDING. Không đánh dấu P21 PASS, không merge/deploy.
