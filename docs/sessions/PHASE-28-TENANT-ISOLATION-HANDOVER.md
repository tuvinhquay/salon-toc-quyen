# Tenant isolation regression trước bàn giao
Ngày: 2026-11-24
Branch: `phase-28-tenant-isolation-handover`
Base: P27 `f3bc440a4096b3d02f4aa6e5e2f9d36fe4b223b1`

## Mục tiêu
Chuẩn bị bàn giao Owner App cho một Google account mới mà không sửa, xóa hoặc chuyển dữ liệu của tài khoản hiện hữu.

## Kết quả rà soát kiến trúc
- Firebase Auth xác định UID đăng nhập.
- Firestore `memberships/{uid}` ánh xạ UID sang salonId; P27 chỉ cho UID chưa có membership tự tạo salon + membership trong cùng batch.
- Dexie/IndexedDB giữ dữ liệu nghiệp vụ cục bộ. Các bảng nghiệp vụ có `salonId`; repository truy vấn danh sách theo salonId và kiểm tra salonId của record trước khi sửa.
- Local assistant đọc các bảng nghiệp vụ bằng `where('salonId').equals(activeSalonId)`.
- Trí nhớ dài hạn lọc theo cả `[salonId+ownerId]`; thao tác lưu trữ kiểm tra cả salonId lẫn ownerId.
- Đăng xuất không xóa IndexedDB. Khi Owner mới tạo tenant với salonId khác, các record cũ vẫn được giữ lại nhưng không được hiển thị trong workspace mới thông qua các repository đã scope.

## Regression tests được thêm
- Danh sách khách hàng chỉ truy vấn salon hiện tại.
- Owner mới không thể sửa customer thuộc salon cũ.
- Các truy vấn business data của local assistant đều scope theo salonId hiện tại.
- Trí nhớ dài hạn được scope theo salonId + ownerId.
- Owner mới không thể archive trí nhớ của Owner cũ.
- Thiếu tenant hoặc owner identity thì không truy vấn trí nhớ.

## Giới hạn cần hiểu rõ
- Đây là tenant isolation ở tầng ứng dụng/repository trên cùng IndexedDB, không phải mã hóa IndexedDB theo từng tài khoản hệ điều hành/trình duyệt.
- Người có quyền truy cập trực tiếp vào profile trình duyệt hoặc thiết bị có thể có khả năng kiểm tra dữ liệu local bằng công cụ phát triển. Không dùng chung thiết bị/trình duyệt không bảo vệ bằng tài khoản hệ điều hành.
- Không tự động copy, migrate hoặc xóa dữ liệu salon cũ sang tenant mới.
- Dữ liệu local chưa đồng bộ đa thiết bị; tài khoản mới trên thiết bị khác sẽ bắt đầu với workspace trống sau khi tạo salon.
- Không thay đổi Firestore Rules, Firebase Auth users, memberships hoặc salons trong phase này.

## Kiểm thử
- GitHub Actions run `45379133999`: PASS – Typecheck, ESLint, Unit tests, Production build/PWA.
- Termux: còn chờ chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `git diff --check`.
- Android smoke test sau CI: đăng nhập Google mới, tạo salon mới, xác nhận salonId khác; xem khách hàng/lịch/dịch vụ/nhân viên/kho/POS/báo cáo/trí nhớ đều trống trong tenant mới; đăng xuất và xác nhận dữ liệu cũ không bị xóa.
- Chưa đánh dấu PASS trước khi có bằng chứng CI và thiết bị.
