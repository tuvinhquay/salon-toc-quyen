# Phase 32 – Trợ lý thao tác sản phẩm & hóa đơn salon

Ngày: 2026-11-25
Branch: `phase-32-assistant-write-actions-and-salon-invoice`
Base: `phase-31-assistant-intent-routing-search-p30` (P30 + Dexie hotfix + Phase 31)

## Trợ lý thao tác kho
- Thêm sản phẩm qua câu tự nhiên có tên, SKU và giá bán.
- Nếu thiếu số lượng tồn đầu hoặc giá vốn đơn vị, bot hỏi rõ và chưa ghi dữ liệu.
- Sau khi đủ dữ liệu, bot hiển thị bản xem trước; chỉ ghi khi Owner nhập “XÁC NHẬN”. “HỦY” hủy thao tác.
- SKU trùng bị chặn.
- Sửa giá bán theo SKU chính xác; bot hiển thị giá cũ/mới và chờ xác nhận.
- Repository tạo product + inventory lot + stock movement + audit event trong một transaction tenant-scoped.

## Hóa đơn salon
- Nút “Xem / In hóa đơn” ở danh sách hóa đơn gần đây.
- Bản in A4, phong cách salon với hoa văn trang nhã.
- Thông tin salon có thể cấu hình: tên, slogan, địa chỉ, điện thoại, email, mã số thuế, ngân hàng/tài khoản và hướng dẫn chăm sóc.
- In thông tin khách, số hóa đơn, ngày giờ, dịch vụ/sản phẩm, số lượng, đơn giá, giảm giá, thuế, tổng, nhân viên theo snapshot, thanh toán/hoàn tiền, số dư và ghi chú.
- Profile salon được lưu local theo salon trên thiết bị.
- Hóa đơn P30 mô phỏng có thể dùng để test ngay; dữ liệu mẫu có cảnh báo giả lập rõ.

## Ranh giới pháp lý
Bản in từ app là phiếu thanh toán nội bộ. Không tuyên bố là hóa đơn điện tử có giá trị pháp lý hoặc có mã cơ quan thuế. Tích hợp nhà cung cấp hóa đơn điện tử là công việc riêng.

## Kiểm tra / nghiệm thu
- Tests: invoice print HTML escaping/content; product sale price schema; P30 demo product prices.
- Chờ CI typecheck/lint/unit/build.
- Chờ Owner chạy trên Termux/Android và kiểm tra in / lưu PDF từ hóa đơn demo.
- Chưa merge, chưa deploy.
