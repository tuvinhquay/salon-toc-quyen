# P20 – Bộ nhớ học hỏi thói quen Owner

Ngày: 2026-11-23  
Nhánh: `phase-19-local-learning-assistant`

## Đã triển khai
- Bộ nhớ được tách theo salonId và Owner UID trong localStorage.
- Chỉ lưu bộ đếm số lần hỏi theo nhóm chủ đề và khoảng thời gian (hôm nay/tháng/năm).
- Không lưu nội dung câu hỏi nguyên văn, tên/điện thoại/email, dữ liệu khách hàng, dữ liệu nhân viên hay số liệu kinh doanh.
- Hiển thị tóm tắt điều trợ lý đã học.
- Có nút xóa bộ nhớ; xóa bộ nhớ không ảnh hưởng dữ liệu nghiệp vụ.
- Lỗi/quota của localStorage không được phép làm hỏng chức năng trợ lý.

## Giới hạn
- Bộ nhớ ở thiết bị hiện tại, chưa đồng bộ qua thiết bị khác.
- Đây là học thói quen sử dụng ở dạng thống kê; chưa tự học quy tắc nghiệp vụ hay tự thay đổi cách tính.
- Những quy tắc tài chính hoặc quyền truy cập phải được chủ tiệm xác nhận và triển khai bằng mã nghiệp vụ, không để bot tự sửa.

## Kiểm thử
- Chờ kiểm thử trình duyệt/Android về lưu, tải lại trang, tách salon và xóa bộ nhớ.
- Chưa đánh dấu PASS.
