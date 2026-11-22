# Kế hoạch kiểm thử

## P01
- TypeScript strict check, ESLint, unit test và production build.
- Kiểm tra responsive 320px, tablet, desktop.
- Kiểm tra manifest/service worker và keyboard navigation.

## Các phase tiếp theo
- Unit test domain calculations, VND, timezone, commission.
- IndexedDB integration, migration và transaction rollback.
- Firebase Emulator Rules: outsider, revoked member/device, read-only, owner-only.
- Workflow event ordering, duplicate delivery và idempotency.
- Inventory concurrent updates, invoice/payment reconciliation.
- P2P encryption, conflict resolution, device revocation.
- Backup tamper detection, wrong key, interrupted restore, rollback.
- Gemini permission isolation, data minimization, timeout, quota, rate limit.

## P17 – Owner App acceptance trên Android/Termux
Thực hiện trên nhánh phase-17-owner-app-acceptance sau khi đồng bộ code mới nhất.

### Kiểm tra tự động
- npm run typecheck
- npm run lint
- npm run test
- npm run build
- git diff --check

### Smoke test trên thiết bị thật
1. Đăng nhập Google bằng tài khoản Owner đã được cấp membership active.
2. Khi membership hợp lệ, vào Dashboard; đăng xuất và đăng nhập lại không bị kẹt màn hình loading.
3. Khi Firestore tạm lỗi hoặc membership vừa được cấp, bấm Thử kiểm tra lại quyền Owner; không được tự cấp quyền ở client.
4. Nạp dữ liệu demo; kiểm tra số lượng và xem dữ liệu ở khách hàng, lịch hẹn, dịch vụ, nhân viên, kho, POS và báo cáo.
5. Tạo một khách hàng thật, dịch vụ thật và lịch hẹn thật; sửa thông tin nhân viên và chuyển active/inactive.
6. Tạo sản phẩm, nhà cung cấp, đơn mua; nhận hàng vào lô; kiểm tra tồn và cảnh báo tồn thấp.
7. Mở ca, lập hóa đơn, thanh toán một phần/toàn phần, thử hoàn tiền theo đúng số đã thanh toán, ghi chi phí và đóng ca; đối chiếu số tiền.
8. Xuất backup mã hóa, xác nhận file được tạo; thử khôi phục vào môi trường/dữ liệu thử trước khi chọn replace dữ liệu đang dùng.
9. Xóa dữ liệu demo; xác minh khách hàng, hóa đơn, lịch sử và dữ liệu thật tạo ở bước 5 vẫn còn nguyên.
10. Tải lại PWA và mở lại app; dữ liệu local vẫn tồn tại trên cùng thiết bị.

### Điều kiện PASS
- Không lỗi runtime nghiêm trọng; không mất dữ liệu sau reload.
- Không thể đọc/ghi chéo salon; thao tác xóa demo không xóa dữ liệu thật.
- Tồn kho, hóa đơn, thanh toán, hoàn tiền và đóng ca đối soát đúng.
- Backup/restore chỉ PASS sau khi kiểm tra file thật và quy trình phục hồi trên thiết bị.
- Các phần P2P, Google Drive và Gemini không phải điều kiện chặn nghiệm thu Owner App cơ bản; phải hiển thị rõ trạng thái chưa triển khai/cấu hình.
