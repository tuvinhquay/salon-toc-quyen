# P19 – Trợ lý nội bộ salon

Ngày: 2026-11-23  
Nhánh: `phase-19-local-learning-assistant`

## Mục tiêu
Trợ lý có thể hiểu câu hỏi tiếng Việt thông dụng và tính toán trực tiếp từ IndexedDB của salon hiện tại, không phụ thuộc Gemini hay Cloud Functions.

## Đã triển khai trên nhánh
- Thêm bộ nhận diện ý định cho câu hỏi tài chính, nhân viên, khách hàng, dịch vụ, lịch hẹn, kho và tổng quan.
- Báo cáo theo hôm nay/tháng này/năm nay với ranh giới ngày theo múi giờ Asia/Ho_Chi_Minh.
- Tách riêng doanh thu hóa đơn phát hành, tiền đã thu, tiền hoàn, chi phí và thu ròng sau hoàn/chi phí.
- Loại hóa đơn void khỏi doanh thu; không suy đoán lợi nhuận khi chưa có đủ giá vốn/chi phí phân bổ.
- Thống kê khách hàng và dịch vụ dựa trên lịch hoàn thành; cảnh báo mặt hàng ở/bên dưới ngưỡng tồn.
- Chat tiếng Việt, gợi ý câu hỏi, trạng thái đang xử lý và thông báo thân thiện.
- Mọi truy vấn đọc Dexie đều lọc salonId; dữ liệu không được gửi ra ngoài trong luồng local-only.

## Giới hạn nghiệp vụ được ghi nhận
- Appointment và Invoice hiện chưa có employeeId thực hiện. Bot không thể xếp hạng nhân viên theo doanh thu hoặc số lượt làm; trả lời rõ thiếu dữ liệu thay vì tự gán.
- Dữ liệu hiện tại chỉ là IndexedDB trên thiết bị đang sử dụng; chưa có đồng bộ đa thiết bị.
- Top khách và dịch vụ hiện đếm lịch hoàn thành, không tính lịch đã hủy/không đến.

## Kiểm thử
- Đã thêm unit tests cho nhận diện câu hỏi và ranh giới ngày/tháng/năm Việt Nam.
- GitHub Actions run #45134545399 đã PASS: typecheck, lint, unit tests, production build/PWA, Functions dependency install và Functions build. Còn chờ kiểm thử trên Termux và Android.
- Chờ smoke test Android với dữ liệu mẫu và đối chiếu thủ công doanh thu/thu/hoàn/chi.

## Trạng thái
CI PASS – chờ smoke test Termux/Android và đối chiếu số liệu thực tế.
