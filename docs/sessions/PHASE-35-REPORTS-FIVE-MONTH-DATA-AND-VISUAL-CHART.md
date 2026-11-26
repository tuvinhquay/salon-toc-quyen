# Phase 35 – Báo cáo doanh thu và biểu đồ trực quan

Ngày: 2026-11-26  
Branch: `phase-35-reports-five-month-data-and-visual-chart`  
Base: `phase-34-owner-glass-contrast-global-video-invoice-deer`

## Vấn đề Owner báo cáo
- Báo cáo hoạt động hiển thị 0 VND dù bộ dữ liệu mẫu có thu ròng khoảng 25 triệu VND.
- Biểu đồ chưa được nâng cấp trực quan như mong đợi.

## Nguyên nhân đã xác định
- `ReportsPage` mặc định lọc từ đầu ngày hiện tại đến đầu ngày kế tiếp.
- Dataset P30 được tạo cho 5 tháng lịch (tháng hiện tại và 4 tháng trước), không bảo đảm có giao dịch trong ngày hiện tại.
- Vì vậy report range chỉ một ngày có thể đúng là 0, nhưng không phù hợp để mở báo cáo mặc định khi Owner đang kiểm tra bộ dữ liệu mẫu.

## Thay đổi
- Mặc định báo cáo bao phủ 5 tháng dữ liệu mẫu: từ ngày đầu tháng cách hiện tại 4 tháng đến trước ngày mai.
- Thêm preset `5 tháng gần nhất`; các preset ngày/tháng/quý/năm tự tải báo cáo ngay, không cần bấm lại nút xem.
- Trường ngày kết thúc được ghi rõ là “Đến trước ngày” vì end time là mốc exclusive.
- Đưa “Thu ròng” lên thẻ nổi bật, kèm công thức thu − hoàn − chi.
- Thay biểu đồ CSS bar cũ bằng SVG grouped bars có lưới, trục giá trị VND compact, nhãn thời gian, tooltip chi tiết và legend cho tiền thu/hoàn/chi; responsive, có thể cuộn ngang trên màn hình nhỏ.
- Empty state dựa trên giao dịch thực tế, không chỉ dựa vào việc có date buckets.
- Regression tests cho default range và tổng thanh toán mẫu 25.000.000 VND.

## Kiểm tra
- GitHub Actions: pending.
- Owner cần kiểm tra trên Termux với bộ demo hiện tại: chọn “5 tháng gần nhất”, đối chiếu thu/hoàn/chi và thu ròng với 25 triệu VND được báo cáo.
- Không merge/deploy cho đến khi CI PASS và Owner xác nhận.
