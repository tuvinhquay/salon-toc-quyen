# Lịch sử phiên làm việc

## Phiên 01 – 2026-11-10 – P01 Foundation

### Đã làm
- Xác minh repository tuv​​inhquay/salon-toc-quyen và quyền Admin/Push.
- Repository Public, default branch main.
- Tạo branch phase-01-foundation.
- Tạo bộ khung React/TypeScript/Vite/Tailwind/PWA và Owner UI shell, không có dữ liệu demo.
- Tạo .env.example và .gitignore.
- Thêm Firebase Web SDK bootstrap có kiểm tra cấu hình; Firebase public config được đưa vào .env.example, không phải Gemini secret.
- Thêm formatter VND và unit test cơ bản.
- Thêm ESLint và Vitest configuration.
- Tạo tài liệu kiến trúc, roadmap, cấu trúc, schema định hướng, bản đồ tính năng, bảo mật, sync/backup, deployment và test plan.
- Thêm GitHub Actions CI workflow để chạy typecheck, lint, unit test và production build trên Node 22.
- Commit CI: 6c3a7898e9d80bf210071eaf8bae59c1bb90d385.

### Chưa nghiệm thu
- Chưa chạy npm install, typecheck, lint, test hoặc production build.
- Đã thử clone repository để chạy kiểm thử nhưng môi trường thực thi không phân giải được github.com; do đó chưa thể cài dependencies hoặc xác nhận build.
- GitHub Actions API hiện trả về 0 workflow runs cho branch; CI chưa có kết quả xác nhận.
- Chưa cấu hình Firebase Authentication, Security Rules hoặc Emulator.
- Chưa cấu hình Gemini server secret/endpoint.
- Chưa triển khai nghiệp vụ salon thật.
- Chưa kiểm tra UI trên trình duyệt thực tế.

### Trạng thái
P01 IN PROGRESS – không đánh dấu PASS trước khi có kết quả kiểm thử thực tế.

### Lưu ý bảo mật
- Repository Public; tuyệt đối không commit secrets.
- Firebase Web API key là cấu hình client public, không thay thế Security Rules.
- Gemini API key không được ghi vào repository; cần thay khóa mới trước production.
- Công cụ GitHub đang kết nối chưa cung cấp thao tác ghi GitHub Actions Secrets/Vercel Environment Variables. Không tuyên bố đã cấu hình những secret đó.

## Phiên 02 – 2026-11-18 – P01 CI bootstrap và sửa lỗi build Termux

### Kết quả kiểm tra người dùng cung cấp
- npm install hoàn tất và tạo package-lock.json cục bộ (chưa được Git theo dõi).
- npm audit fix cập nhật 14 packages và thêm 1 package; audit vẫn còn 23 cảnh báo (2 moderate, 21 high ở lần chạy sau sửa).
- Firebase 12.19.0; Vitest 4.1.12; Vite 7.3.8; picomatch 4.0.7.
- Đã phê duyệt install script riêng cho esbuild; Firebase util và protobufjs vẫn đang bị chặn.
- typecheck, lint và unit tests đều PASS; 1 test file, 2 tests.
- Vite bundle thành công, nhưng Workbox không tạo được Service Worker do Terser worker Unexpected early exit trên Termux/Android.
- Lỗi cùng dạng đã được ghi nhận trong Rollup plugin-terser trên Android ARM64; đây là giới hạn môi trường build, chưa phải lỗi nghiệp vụ Salon hay bằng chứng ENA xung đột.

### Thay đổi kỹ thuật
- Workbox dùng development mode riêng khi chạy trong Termux để tránh Terser worker; các môi trường khác, đặc biệt GitHub Actions, vẫn dùng production mode.
- Bổ sung SVG PWA icon thay cho manifest icons rỗng.
- Kích hoạt CI trên nhánh fix/p01-ci-bootstrap; CI production build vẫn kiểm tra Service Worker tối ưu.
- Giữ P01 IN PROGRESS cho đến khi CI production, package-lock đồng bộ, audit review và UI/PWA smoke test hoàn tất.

### Việc còn lại
- Đồng bộ package-lock từ Termux lên nhánh sửa.
- Chạy lại typecheck, lint, test, build tại Termux sau khi đồng bộ.
- Kiểm tra GitHub Actions production build.
- Xử lý dependency audit còn tồn tại bằng nâng cấp/override có kiểm thử, không dùng npm audit fix --force.
- Rà soát và phê duyệt install scripts còn lại theo đúng nhu cầu package.
