# ROADMAP – Salon TÓC QUYỀN

Phạm vi: Giai đoạn 1 – Owner App. Không xây Employee App trước khi Owner App được nghiệm thu và có yêu cầu.

| ID | Hạng mục | Trạng thái |
|---|---|---|
| P01 | Repository, cấu trúc, UI shell, tài liệu | IN PROGRESS |
| P02 | Firebase Auth, Owner bootstrap, membership, Rules | NOT STARTED |
| P03 | Dexie schema, migration, validation | NOT STARTED |
| P04 | Khách hàng và lịch hẹn | NOT STARTED |
| P05 | Dịch vụ, công thức, workflow event log | NOT STARTED |
| P06 | Nhân viên, ca làm, quyền, hoa hồng | NOT STARTED |
| P07 | Kho, lô, vật tư tiêu hao | NOT STARTED |
| P08 | POS, hóa đơn, thanh toán, thuế cấu hình | NOT STARTED |
| P09 | Dashboard, năng suất, báo cáo drill-down | NOT STARTED |
| P10 | Thiết bị, WebRTC, E2E encryption, conflict | NOT STARTED |
| P11 | Backup/restore mã hóa | NOT STARTED |
| P12 | Gemini server API, quota, quyền | NOT STARTED |
| P13 | PWA, bảo mật và nghiệm thu | NOT STARTED |

## Definition of Done
Implementation thật; validation; error handling; security; unit/integration/regression tests; typecheck, lint, production build; mobile/desktop verification; tài liệu và session log. Chỉ PASS khi có bằng chứng.

## P01 validation notes – cập nhật 2026-11-18
- GitHub Actions Run #5, commit `9972fcf0135b1d748be52e79368718891b92e994`: **PASS**.
- CI đã dùng `npm ci` từ `package-lock.json`; cài dependencies, typecheck, lint, unit tests và production build/PWA Service Worker đều PASS.
- GitHub Actions Run #4, commit `bd7f790`, cũng PASS toàn bộ với `npm install`.
- Termux: người dùng xác nhận typecheck, lint, unit tests và production build đều PASS; Workbox tạo được Service Worker.
- `package-lock.json` đã được commit và đồng bộ lên nhánh `fix/p01-ci-bootstrap`.
- Workflow CI đã bật npm cache và sử dụng Node 22.
- Không sửa nhánh `main`; các thay đổi foundation/fix hiện nằm trên nhánh làm việc.

## P01 còn cần hoàn tất
- Rà soát 23 cảnh báo dependency từ lần `npm audit` gần nhất (2 moderate, 21 high); không dùng `npm audit fix --force`. Cần xác định dependency path, mức ảnh hưởng production/dev và phương án cập nhật an toàn có kiểm thử.
- Kiểm tra giao diện trên trình duyệt thực tế ở mobile/tablet/desktop; xác nhận menu, trạng thái offline và PWA install/update.
- Rà soát các liên kết điều hướng hiện là UI shell, chưa phải route nghiệp vụ; không được hiểu nhầm module chưa triển khai là chức năng đã hoạt động.
- Chỉ chuyển P01 sang PASS sau khi các mục còn lại có bằng chứng và session log được cập nhật.

## P01 cập nhật giao diện điều hướng – 2026-11-18
- Commit `7f3a454f69aebb067b1a0ed186406cf3e7594778`: Owner route shell và 13 mục điều hướng; GitHub Actions Run #7 **PASS** (npm ci, typecheck, lint, unit tests, production build/PWA).
- Tiếp tục sửa responsive menu mobile để các mục điều hướng không bị ẩn trên màn hình nhỏ; bổ sung style cho trang module. Chờ CI mới xác nhận sau commit.
