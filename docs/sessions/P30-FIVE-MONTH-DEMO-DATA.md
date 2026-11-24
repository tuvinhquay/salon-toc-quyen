# P30 – Bộ dữ liệu mô phỏng kinh doanh 5 tháng

## Mục tiêu
Thay bộ mẫu P14 đơn giản (10 khách, 10 nhân viên, vài lịch hẹn và sản phẩm) bằng một kịch bản kinh doanh liên tục để Owner có thể quan sát Dashboard, báo cáo, trợ lý, POS, nhân sự, kho và chi phí.

## Triển khai trên nhánh
- Branch: `phase-30-five-month-realistic-business-demo`
- Base: `phase-29-assistant-natural-language-and-configurable-analytics`
- Không sửa `main`, không merge PR nền, không deploy Firebase/Hosting.

## Nội dung dữ liệu
- 5 tháng lịch gần nhất, gồm tháng hiện tại đến ngày hiện tại; phạm vi tự trượt theo ngày tạo dataset.
- 120 hồ sơ khách hàng giả lập, 5 nhóm khách và custom fields theo bối cảnh Ngã Giao / TP.HCM.
- 10 nhân viên giả lập; ca làm 8 giờ phân bố trong ngày/tuần; trạng thái nhân sự và ca lịch sử.
- 8 dịch vụ, 12 sản phẩm, 4 nhà cung cấp; đơn nhập hàng theo tháng, lô tồn, receipt/consumption stock movements.
- Lịch hẹn đã hoàn thành, hủy, no-show và chờ xác nhận; hóa đơn liên kết khách, dịch vụ/sản phẩm, nhân viên thực hiện, thuế mô phỏng, thanh toán và một số hoàn tiền.
- khoảng 20–23 tuần/ca thu ngân theo tuần; số tiền dự kiến, kiểm đếm và chênh lệch.
- Chi phí cố định theo tháng, bảo trì và giá vốn phân bổ từ lượng sản phẩm/vật tư đã xuất dùng.

## Bảo vệ dữ liệu
- Mọi record giả lập có ID tiền tố `demo_<salonId>_` và chỉ thuộc salon hiện tại.
- Tên, số điện thoại và thông tin nhà cung cấp là dữ liệu giả; số điện thoại được dùng mẫu không hợp lệ `000000...`, không phải số liên lạc thật.
- Tạo/thay mới hoặc xóa chỉ tác động record demo. Nếu có giao dịch thật tham chiếu tới record demo, thao tác bị chặn để bảo toàn lịch sử.
- Tạo dataset mới và xóa dataset đều dùng transaction Dexie; không ghi đè record thật.
- Không thay Firebase Auth, Firestore Rules, tenant membership hoặc P2P/backup.

## UI
- Cài đặt thay nội dung “Nạp dữ liệu mẫu / Xóa dữ liệu mẫu” cũ bằng “Tạo / thay mới bộ mô phỏng 5 tháng” và “Xóa bộ mô phỏng”.
- Hiển thị số lượng khách, nhân viên/ca, hóa đơn, sản phẩm và chi phí.

## Kiểm thử / nghiệm thu
- Thêm test cho rolling five-month period, year-boundary và kiểm tra bundle: số lượng, liên kết khách/nhân viên, phép tính hóa đơn, thanh toán và cân bằng nhập-xuất-tồn.
- CI run 45512975364 tại commit code 679e207746eedab3aebb0370372fc9e7232dc154: Typecheck PASS, ESLint PASS, 53/53 tests PASS, Production build/PWA PASS.
- Còn cần Owner smoke test trên Termux/Android: tạo dataset, xem báo cáo 5 tháng, trợ lý truy vấn, POS/kho/ca làm, thay dataset, xóa dataset và xác minh dữ liệu thật được giữ nguyên.
- CI đã PASS; P30 vẫn chưa PASS tổng thể cho tới khi Owner nghiệm thu Android/Termux. Không merge hoặc deploy.
