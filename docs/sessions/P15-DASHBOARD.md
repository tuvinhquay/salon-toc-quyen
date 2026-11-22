# P15 – Dashboard số liệu thực

Ngày: 2026-11-22
Nhánh: `phase-14-owner-app-polish-demo-data`

## Mục tiêu
Thay nội dung giới thiệu tĩnh bằng bảng điều hành lấy số liệu từ IndexedDB của salon.

## Nội dung
- Lịch hẹn trong ngày, bỏ lịch hủy và no-show.
- Tổng khách hàng đang hoạt động.
- Số nhân viên active.
- Số sản phẩm và cảnh báo mặt hàng có tồn khả dụng <= ngưỡng tối thiểu.
- Thu ròng tháng hiện tại = tiền đã thu - hoàn tiền - chi phí theo repository báo cáo.
- Danh sách lịch hôm nay và danh sách cảnh báo tồn kho.

## Giới hạn
Dữ liệu chỉ phản ánh thiết bị hiện tại vì nghiệp vụ chưa có đồng bộ cloud/P2P.

## Kiểm thử
Chờ CI đầy đủ và đối chiếu số liệu dashboard với các module nguồn trên Android.
