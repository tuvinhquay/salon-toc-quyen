# P26 – Tinh gọn Owner onboarding và thông báo lỗi tạo salon
Ngày: 2026-11-24
Branch: `phase-26-owner-onboarding-clean-ui`
Base: `phase-25-business-brain-multitenant`

## Mục tiêu
Giúp tài khoản Google mới hiểu rõ rằng họ chưa có không gian salon, có thể tạo tenant riêng hoặc chuyển sang tài khoản khác. Giảm thông tin kỹ thuật gây rối trên màn hình và không để lộ mã lỗi Firebase thô.

## Thay đổi
- Thiết kế lại Owner Access Control thành màn hình onboarding gọn: email tài khoản, tên salon, nút tạo salon, đổi tài khoản và đăng xuất.
- Đưa Firebase UID vào mục “Thông tin kỹ thuật” thu gọn; không hiển thị mặc định.
- Phân biệt trạng thái chưa có membership với membership sai trạng thái hoặc lỗi xác minh; không tự cấp quyền trong client.
- Chuẩn hóa thông báo lỗi khi tạo salon: hướng dẫn trường hợp Cloud Function chưa deploy, phiên đăng nhập hết hạn, quyền bị từ chối, máy chủ tạm thời không phản hồi hoặc tên salon không hợp lệ.
- Không hiển thị chuỗi kỹ thuật kiểu `internal [0]` cho người dùng.
- Giữ nguyên cơ chế Admin SDK tạo salon + membership và kiểm tra lại membership trước khi mở ứng dụng.

## Phạm vi không thay đổi
- Không sửa Firestore Rules, không đổi project Firebase, không deploy Function/Hosting.
- Không ghi/xóa membership hiện tại, không xóa dữ liệu salon hoặc IndexedDB.
- Không thay đổi mô hình một UID owner – một salon.

## Kiểm thử còn chờ
- GitHub Actions: typecheck, lint, unit tests, frontend build/PWA và Cloud Functions build.
- Termux: đồng bộ branch P26, chạy các lệnh kiểm tra hiện có.
- Android: kiểm tra màn hình trên điện thoại, đổi tài khoản Google, tạo salon sau khi callable đã được deploy.
- Runtime tạo tenant chưa thể PASS cho tới khi xác nhận callable `createOwnerSalon` đã deploy đúng Firebase project `salonquyen-f21fa`.
