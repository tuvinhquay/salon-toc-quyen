# Phase 36 – Ngôn ngữ thân thiện với chủ tiệm

Ngày: 2026-11-26  
Branch: `phase-36-owner-friendly-language`  
Base: `phase-35-reports-five-month-data-and-visual-chart`

## Mục tiêu
- Giảm cách diễn đạt mang tính kỹ thuật/kế toán trong trợ lý và các màn hình Owner.
- Người dùng phổ thông đọc hiểu ngay, không cần biết thuật ngữ phần mềm.
- Không thay công thức, số liệu, quyền truy cập, dữ liệu hoặc nghiệp vụ.

## Thay đổi
- Câu trả lời tài chính của trợ lý dùng lời đời thường: tổng tiền hóa đơn, tiệm đã thu, tiền hoàn lại khách, các khoản chi đã nhập và tiền còn lại sau khi trừ hoàn tiền/chi phí.
- Với câu hỏi “lợi nhuận”, trợ lý nêu rõ đây là số tiền còn lại theo các khoản đã nhập, chưa khẳng định là lợi nhuận cuối cùng nếu tiền vật tư, tiền công hoặc hoa hồng còn thiếu.
- Thêm bộ chuyển đổi từ thuật ngữ kế toán/kỹ thuật sang từ ngữ thân thiện cho câu trả lời tư vấn AI.
- Điều chỉnh hướng dẫn cho Gemini: kết quả trước, giải thích sau; tránh thuật ngữ; nêu rõ thông tin còn thiếu.
- Làm rõ tiêu đề, chú thích báo cáo, biểu đồ, Dashboard và màn hình trợ lý; thay các từ như “thu ròng”, “ngưỡng tồn tối thiểu”, “IndexedDB”, “bộ não trợ lý” bằng cách nói dễ hiểu.
- Thêm unit tests khóa cách trả lời lợi nhuận và chuyển đổi thuật ngữ.

## An toàn và phạm vi
- Chỉ sửa nội dung hiển thị và hướng dẫn tạo câu trả lời.
- Không thay số liệu tài chính, cách tính, dữ liệu demo, IndexedDB schema, Firebase/Auth, tenant scope, quyền Owner hoặc thao tác ghi dữ liệu.
- PR Draft, không merge/deploy.

## Kiểm tra
- Unit test mới: pending CI.
- Cần Owner kiểm tra trực tiếp câu hỏi “Tổng lợi nhuận tháng này bao nhiêu tiền?” và các màn hình Dashboard/Báo cáo sau khi cập nhật.
