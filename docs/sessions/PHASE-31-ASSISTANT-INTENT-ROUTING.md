# Phase 31 – Trợ lý hiểu đúng ý định và tra cứu chính xác

Ngày: 2026-11-25
Branch: `phase-31-assistant-intent-routing-search`
Base: `phase-29-assistant-natural-language-and-configurable-analytics`

## Mục tiêu Owner
Trợ lý là công cụ tra cứu và tính toán dữ liệu salon. Ưu tiên đúng đối tượng, đúng chỉ số và đúng phạm vi thời gian; không cần câu trả lời dài hoặc văn phong thuyết trình.

## Thay đổi
- Tra cứu khách hàng theo tên đầy đủ, tên một phần hoặc số điện thoại.
- Không tìm trong khách hàng archived.
- Nếu khớp nhiều hồ sơ, trả danh sách để Owner xác nhận; không chọn gần đúng tự động.
- Câu hỏi có tên khách cụ thể trả hồ sơ và số liệu tổng hóa đơn/lịch hẹn của người đó, không trả báo cáo top khách.
- Xếp hạng khách theo một tiêu chí rõ: số lịch hẹn hợp lệ, tổng giá trị hóa đơn, hoặc số lượng sản phẩm trên hóa đơn.
- Nếu chỉ hỏi “khách nào nhiều nhất” mà chưa nói tiêu chí, hỏi lại.
- Yêu cầu tra cứu nhân viên không tìm thấy sẽ báo không tìm thấy; không fallback thành báo cáo hiệu suất.

## Kiểm thử
- Tên khách đầy đủ, tên một phần, số điện thoại.
- Nhiều kết quả và archived customer.
- Phân biệt tra cứu hồ sơ với câu hỏi xếp hạng.
- Cần CI typecheck/lint/tests/build và Owner kiểm tra Termux/Android.

## Giới hạn
- Chat chỉ đọc. Không tạo/sửa/xóa hồ sơ qua chat.
- Số liệu được lấy từ IndexedDB của salon hiện tại trên thiết bị; chưa đồng bộ sang peer khác.
- Chưa merge PR, chưa deploy Firebase/Hosting.
