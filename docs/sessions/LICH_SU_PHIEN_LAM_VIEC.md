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
