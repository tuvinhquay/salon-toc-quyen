# P14 – Bộ dữ liệu mẫu Owner App

Ngày: 2026-11-22
Nhánh: `phase-14-owner-app-polish-demo-data`

## Mục tiêu
Tạo dữ liệu thực hành để chủ salon có thể kiểm tra các module trước khi nhập dữ liệu thật.

## Nội dung
- 10 nhân viên; 10 khách hàng; 6 dịch vụ; 8 lịch hẹn.
- 10 ca làm; 10 chính sách hoa hồng; 6 sản phẩm; 2 nhà cung cấp.
- 2 đơn mua đã nhận; 6 lô tồn; 6 biến động nhập kho để thử luồng kho/POS.
- 2 đơn mua đã nhận; 6 lô tồn; 6 biến động nhập kho.
- Trang Cài đặt hiển thị số lượng mẫu, nạp một lần và xóa riêng mẫu.

## An toàn dữ liệu
- Mọi bản ghi mẫu có `salonId` hiện tại và ID tiền tố `demo_<salonId>_`.
- Không dùng ID của dữ liệu thật; không ghi đè bản ghi thật.
- Xóa chỉ lọc theo đúng salonId và tiền tố demo.
- Trước khi xóa, kiểm tra tham chiếu từ lịch hẹn, hóa đơn, ca làm, hoa hồng, đơn mua, lô tồn, biến động kho và workflow events; nếu có tham chiếu thì chặn xóa để bảo toàn lịch sử.
- Chưa xóa audit record thật; audit seed có prefix demo nên chỉ xóa được bản ghi seed.

## Kiểm thử
- CI ban đầu bắt lỗi Dexie transaction overload; đã sửa cả seed và cleanup.
- GitHub Actions tại commit `e5d95e0` đã PASS: Typecheck, Lint, Unit tests, Production build/PWA, cài dependencies và build Cloud Functions.
- Smoke test Android/IndexedDB vẫn chờ trước khi PASS cuối cùng.
