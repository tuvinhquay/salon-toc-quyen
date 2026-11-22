# P16 – Hoàn thiện thao tác nhân sự và cảnh báo kho

Ngày: 2026-11-22
Nhánh: `phase-14-owner-app-polish-demo-data`

## Nhân sự
- Bổ sung chọn hồ sơ để chỉnh sửa, lưu lại qua `saveEmployee` và repository audit.
- Bổ sung chuyển active/inactive thay vì xóa hồ sơ, giữ lịch sử và dữ liệu liên quan.
- Chỉ nhân viên active được chọn khi tạo ca mới.

## Kho
- Hiển thị nhãn cần nhập hàng khi tồn khả dụng <= minimumStock.
- Không tự điều chỉnh số lượng tồn; số tồn vẫn được tính từ inventory lots và stock movements.

## Kiểm thử
Chờ CI đầy đủ và smoke test thao tác edit/disable/reactivate cùng kiểm tra cảnh báo tồn.
