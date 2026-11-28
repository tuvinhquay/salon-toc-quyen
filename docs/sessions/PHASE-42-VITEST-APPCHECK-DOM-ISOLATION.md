# Phase 42 follow-up – Vitest và Firebase App Check DOM isolation
Ngày: 2026-11-28

## Hiện tượng
Owner chạy `npm test` trên Termux:
- 69 test PASS ở 16 suite.
- `tests/assistant-gemini.test.ts` không khởi tạo được suite.
- Stack trace: `ReferenceError: document is not defined` tại `initializeAppCheck` trong `src/lib/firebase.ts`.
- Firebase App Check còn in debug token và cảnh báo IndexedDB không tồn tại trong Node test environment.

## Nguyên nhân
`assistant-gemini.ts` chỉ cần Firebase project ID để hiển thị thông tin chẩn đoán, nhưng import `firebaseEnvDiagnostics` từ `src/lib/firebase.ts`. Import này thực thi toàn bộ module Firebase và gọi `initializeAppCheck` khi có reCAPTCHA site key. Vitest đang chạy `environment: node`, không có DOM hoặc IndexedDB nên suite thất bại trước khi chạy test.

## Thay đổi
- Bỏ import `firebaseEnvDiagnostics` khỏi `src/app/assistant-gemini.ts`.
- Đọc trực tiếp `import.meta.env.VITE_FIREBASE_PROJECT_ID` cho hai trường chẩn đoán `expectedProject` và `firebaseProjectId`; không khởi tạo Firebase chỉ để hiển thị project ID.
- Không sửa `src/lib/firebase.ts`; Firebase Auth, Firestore, App Check và cấu hình reCAPTCHA runtime được giữ nguyên.
- Thêm nhánh sửa vào CI push filter và bổ sung Phase 42 vào pull_request base filter.
- Cập nhật ROADMAP.

## Nhánh và commit
- Branch: `phase-42-fix-vitest-appcheck-dom-isolation`
- Base: `phase-42-gemini-aistudio-termux-env`
- Code: `e8d6e05773a148583f9adb93a3e6c731a30ab46a`
- CI config: `51aca6db3a0e6cc04fbd88474727aebc387d1bbc`
- ROADMAP: `edca8462f438ed1707fd1db4b301de3930817a3c`

## Kiểm chứng còn thiếu
- Chưa chạy được Termux sau bản sửa.
- Chưa có kết quả CI xác nhận.
- Chưa kiểm tra Gemini live API trên thiết bị.
- ESLint 17 warnings hiện hữu chưa được xử lý trong hotfix này vì không phải nguyên nhân làm suite thất bại.
- Build warning của Rollup/Zod và chunk size cần được đánh giá riêng; build trước hotfix đã hoàn tất thành công.

## Trạng thái
FIX IMPLEMENTED ON BRANCH – PENDING CI + TERMUX REGRESSION. Không đánh dấu PASS, không merge/deploy cho đến khi toàn bộ lệnh kiểm tra chạy lại thành công.
