# P17 – Nghiệm thu và ổn định Owner App

Ngày: 2026-11-22  
Nhánh: phase-17-owner-app-acceptance  
Base: P14–P16 25be9737686600b68e1c0df58f6b430744086dfa

## Mục tiêu
Đưa Owner App tới trạng thái có thể nghiệm thu nghiệp vụ thực tế trên Android, không mở rộng sang P2P, Employee App hay AI nâng cao trong giai đoạn này.

## Rà soát ban đầu
- Điều hướng có 13 module Owner.
- Dữ liệu nghiệp vụ dùng Dexie/IndexedDB trên thiết bị.
- Các module hiện có giao diện cho khách hàng, dịch vụ, lịch hẹn/quy trình, nhân viên, kho, POS, báo cáo, backup, thiết bị và cài đặt.
- Dữ liệu demo có phạm vi salon và cơ chế bảo vệ dữ liệu thật khi xóa.
- Ứng dụng hiển thị rõ dữ liệu đang lưu cục bộ và chưa đồng bộ.

## Sửa trong P17
- AuthGate trước đây chỉ hiện thông báo và nút đăng xuất nếu không xác minh được Owner membership.
- Bổ sung nút thử xác minh lại quyền Owner để xử lý lỗi mạng tạm thời hoặc trường hợp quyền vừa được cấp.
- Kiểm tra lại vẫn yêu cầu Firestore membership tồn tại, status=active, role=owner, salonId không rỗng. Client không có chức năng tự cấp quyền.

## Checklist nghiệm thu
- [ ] Typecheck
- [ ] Lint
- [ ] Unit tests
- [ ] Production build/PWA
- [ ] Đăng nhập Google và xác minh Owner membership
- [ ] Retry xác minh membership
- [ ] Khách hàng/dịch vụ/lịch hẹn/quy trình
- [ ] Nhân viên/ca làm/hoa hồng
- [ ] Sản phẩm/nhà cung cấp/đơn mua/nhận hàng/tồn kho
- [ ] Mở ca/hóa đơn/thanh toán/hoàn tiền/chi phí/đóng ca
- [ ] Dashboard/báo cáo đối soát
- [ ] Nạp và xóa dữ liệu demo; bảo toàn dữ liệu thật
- [ ] Backup/restore mã hóa trên thiết bị
- [ ] Reload PWA và xác nhận dữ liệu IndexedDB còn nguyên

## Trạng thái
**IN PROGRESS – chưa nghiệm thu runtime.**  
Không merge PR, không deploy thay đổi Firebase và không đánh dấu Owner App PASS cho đến khi có kết quả kiểm thử Termux/Android.
