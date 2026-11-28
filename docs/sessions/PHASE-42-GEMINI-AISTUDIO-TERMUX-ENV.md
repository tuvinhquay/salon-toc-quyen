# Phase 42 – Gemini Developer API (Google AI Studio) cho Termux

Ngày: 2026-11-28  
Branch: `phase-42-gemini-aistudio-termux-env`  
Base: `phase-41-app-check-local-debug-provider`

## Mục tiêu
- Gỡ Firebase AI Logic khỏi luồng trợ lý Owner.
- Gọi Gemini Developer API bằng API key Google AI Studio.
- Đọc `GEMINI_API_KEY` từ `.env.local` ở Node/Vite dev server; tuyệt đối không dùng `VITE_GEMINI_API_KEY`.
- Giữ nguyên Firebase Authentication, Firestore, dữ liệu Dexie, trí nhớ local, định tuyến local/hybrid và quyền Owner.
- Không deploy, không merge và không thay đổi dữ liệu Firebase.

## Thay đổi trên nhánh
- `src/app/assistant-gemini.ts`: thay import `firebase/ai` bằng HTTP client gọi endpoint nội bộ `/__local-api/gemini`; giữ timeout, model, prompt và redaction.
- `vite.config.ts`: thêm Vite dev middleware làm proxy server-side đến Gemini Developer API; chỉ chấp nhận Origin localhost/127.0.0.1/::1, giới hạn body 16 KB, prompt 12.000 ký tự và 30 request/phút theo địa chỉ kết nối; API key không được gửi xuống browser.
- `src/app/AssistantPage.tsx`: hiển thị đúng nhà cung cấp AI Studio và nơi lưu khóa, không còn báo trạng thái reCAPTCHA/App Check cho Gemini.
- `tests/assistant-gemini.test.ts`: kiểm tra request qua local proxy và redaction lỗi.
- `.env.example`: thêm hướng dẫn biến `GEMINI_API_KEY` server-only.
- `docs/ROADMAP.md`: cập nhật P21 sang Gemini Developer API.

## Cấu hình trên Termux
Thêm vào file `.env.local` hiện có, không ghi đè các biến Firebase:
```env
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_API_KEY
```
Không thêm tiền tố `VITE_`. Không commit, không gửi khóa vào chat. Sau khi sửa `.env.local`, phải dừng và chạy lại Vite để nạp biến mới.

## Giới hạn kiến trúc cần nhớ
- Proxy này chỉ tồn tại trong Vite development server trên Termux; không hoạt động trong production build/hosting. Đây là chủ đích để khóa không lọt vào bundle trình duyệt.
- Khi cần triển khai công khai, phải chuyển proxy sang backend server có secrets (không đưa key vào biến VITE_).
- Firebase App Check hiện vẫn được giữ nguyên trong `src/lib/firebase.ts` để không vô tình thay đổi cơ chế bảo vệ Firebase Auth/Firestore; Gemini mới không gọi Firebase AI Logic và không gửi request qua App Check.
- Không ghi nhận live Gemini PASS cho đến khi Owner chạy test thật bằng key của mình trên Termux.

## Kiểm thử
- Unit test mới được thêm nhưng chưa chạy trong môi trường Termux ở thời điểm ghi chú.
- Cần CI: typecheck, lint, unit tests, production build.
- Cần Termux smoke test: xác nhận `.env.local` có biến (không in giá trị), restart Vite, mở app bằng localhost, chạy nút “Kiểm tra kết nối”, gửi một câu hỏi chat.
- Kiểm tra không có request nào tới `firebasevertexai.googleapis.com`; request Gemini đi tới `generativelanguage.googleapis.com`.
- Không merge/deploy cho tới khi CI và live smoke test hoàn tất.


## Audit follow-up – sửa lỗi phản hồi rỗng và chẩn đoán cấu hình
- Audit mã nguồn phát hiện nút kiểm tra kết nối chỉ cấp `maxOutputTokens=24` cho Gemini 3.8 Flash. Đây là mức quá thấp với model có token suy luận; token suy luận cũng tiêu thụ ngân sách đầu ra nên model có thể kết thúc mà không có phần text hiển thị.
- Tăng ngân sách smoke test lên 1.024 token; đặt `thinkingConfig.thinkingLevel=LOW` ở proxy; tăng timeout kiểm tra; các luồng chat/tư vấn dùng ngân sách 2.048 token.
- Proxy hiện phân biệt prompt bị chặn, hết token (ví dụ `MAX_TOKENS`), khóa bị từ chối, quyền truy cập, model không tồn tại, quota và dịch vụ quá tải. Không trả nguyên văn lỗi upstream hoặc khóa API về trình duyệt.
- Audit phát hiện UI vẫn dùng thông báo lỗi Firebase AI Logic/App Check và `VITE_FIREBASE_API_KEY` dù luồng đã chuyển sang Gemini Developer API. Đã thay bằng hướng dẫn theo lỗi của Gemini API.
- Audit phát hiện UI đọc `geminiConfigStatus.expectedProject` nhưng hàm cấu hình không cung cấp trường này. Đã nối chẩn đoán Firebase project thật từ `firebaseEnvDiagnostics` và làm rõ cảnh báo project chỉ liên quan Firebase Auth/Firestore, không tự nó quyết định Gemini AI Studio.
- Đã mở rộng unit tests cho ngân sách smoke test và trường chẩn đoán project. Chưa chạy CI/Termux runtime trong bước audit này; chưa xác nhận khóa thực tế hoặc kết nối live.
- Firebase Auth, Firestore, App Check và dữ liệu Dexie không bị thay đổi; không deploy, không merge.


## Audit follow-up 2 – GEMINI_SERVICE_UNAVAILABLE (HTTP 503)
- User reported `GEMINI_SERVICE_UNAVAILABLE` after pressing the connection test. Source audit confirms the proxy maps this code specifically from Google's upstream HTTP 503 response; it is not the missing-key or invalid-key branch.
- Google AI Developers guidance states HTTP 503 indicates temporary service/model overload and recommends retry with exponential backoff. This can occur even when the API key and request are valid.
- Updated Vite proxy to retry transient upstream HTTP 500/502/503/504 at most two additional times, with exponential backoff plus jitter. Authentication, validation and quota errors are not retried.
- Preserve upstream 503 as HTTP 503 locally for clearer diagnostics. Increased client-side timeout windows to accommodate the bounded retry sequence.
- Commit(s): `46a8a9bd3b58eede80a84ebed1e547073ea90911`, `07a781b27eddf77b5e4ff6094893855ec69d75a4`.
- Still pending: CI verification and a real Termux smoke test. No merge/deploy.
