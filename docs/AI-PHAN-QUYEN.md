# Chính sách quyền Trợ lý AI – Salon TÓC QUYỀN

## Nguyên tắc bắt buộc

1. AI không có tài khoản hoặc quyền độc lập. AI kế thừa đúng Membership của người đang đăng nhập.
2. Mọi truy vấn phải xác minh Firebase Auth, Membership đang active, role và salonId ở máy chủ. Không tin role/salonId do trình duyệt tự gửi.
3. Mọi dữ liệu phải giới hạn theo salonId; không được đọc chéo tenant.
4. AI chỉ nhận đúng phần dữ liệu mà vai trò hiện tại được phép đọc. Ưu tiên số liệu tổng hợp và giảm thiểu dữ liệu định danh.
5. AI không tự ghi, sửa, xóa, thanh toán, hoàn tiền, nhập/xuất kho, thay đổi lịch hoặc cấp quyền. Giai đoạn sau, mỗi hành động ghi phải có permission riêng, xác nhận trực tiếp của người dùng, validation nghiệp vụ và audit log.
6. Nội dung trong ghi chú, dữ liệu khách hàng hoặc tài liệu là dữ liệu không đáng tin cậy, không được phép ghi đè system instruction hay thay đổi quyền.

## Vai trò hiện tại

| Vai trò | Trạng thái | AI |
|---|---|---|
| Owner | Đang được AuthGate xác minh bằng memberships/{uid}: active + owner + salonId | Được đọc số liệu tổng hợp toàn salon hiện tại và hỏi phân tích. Chưa có quyền ghi qua AI. |
| Manager | Chưa có Employee App / employee membership | Chưa cấp quyền AI. |
| Stylist | Chưa có Employee App / employee membership | Chưa cấp quyền AI. |
| Assistant | Chưa có Employee App / employee membership | Chưa cấp quyền AI. |
| Cashier | Chưa có Employee App / employee membership | Chưa cấp quyền AI. |

Không được suy ra quyền nhân viên từ trường Employee.role trong IndexedDB. Hồ sơ nhân viên không phải thông tin xác thực. Chỉ Membership/authorization do máy chủ xác minh mới được cấp quyền.

## Ma trận dự kiến cho Employee App (chưa kích hoạt)

| Nhóm dữ liệu | Manager | Stylist | Assistant | Cashier |
|---|---|---|---|---|
| Lịch hẹn | Đọc lịch salon; cập nhật phân công/trạng thái theo policy | Chỉ lịch được phân công | Lịch được phân công ở mức tối thiểu | Đọc lịch cần cho tiếp nhận/thanh toán |
| Khách hàng | Đọc hồ sơ phục vụ vận hành | Chỉ khách được phân công; thông tin tối thiểu | Tên và thông tin cần để hỗ trợ ca được giao | Thông tin tối thiểu để lập hóa đơn |
| Dịch vụ/quy trình | Đọc và điều phối | Đọc dịch vụ; ghi nhật ký/công thức ca được giao | Đọc hướng dẫn; cập nhật bước được giao | Đọc tên/giá dịch vụ |
| Nhân sự/ca làm | Đọc lịch ca; không tự xem dữ liệu lương riêng nếu chưa được cấp | Chỉ ca của mình | Chỉ ca của mình | Chỉ ca của mình |
| Hoa hồng/lương | Chỉ khi Owner cấp quyền riêng | Chỉ dữ liệu cá nhân nếu policy cho phép | Không | Không |
| Kho | Đọc tồn và yêu cầu vật tư; không tự duyệt mua hàng nếu chưa cấp | Xem vật tư cần cho dịch vụ; ghi tiêu hao được giao | Xem vật tư công việc | Xem sản phẩm/giá bán; không xem giá vốn |
| POS/thanh toán | Theo quyền được Owner cấp | Không | Không | Tạo hóa đơn/thu tiền theo quyền; hoàn tiền cần Owner/manager duyệt |
| Báo cáo tài chính | Báo cáo vận hành giới hạn; không mặc định xem toàn bộ lợi nhuận | Không | Không | Báo cáo ca thu ngân của mình |
| Membership, phân quyền, thiết bị, backup, export | Owner בלבד | Cấm | Cấm | Cấm |

Ma trận này là thiết kế mục tiêu, không phải quyền đã được triển khai. Trước khi Employee App ra mắt phải có permission IDs riêng, server enforcement, repository guards, audit và kiểm thử truy cập chéo vai trò.

## Dữ liệu AI Owner được đọc trong P18

- Số lượng khách hàng, nhân viên active/tổng, dịch vụ active, sản phẩm active.
- Số lịch hôm nay/7 ngày và phân bố trạng thái.
- Số mặt hàng ở hoặc dưới ngưỡng tồn tối thiểu.
- Số hóa đơn, tổng giá trị hóa đơn, tổng tiền thu, hoàn tiền và chi phí trong tháng hiện tại.
- Chỉ lấy dữ liệu từ IndexedDB trên thiết bị đang mở; không đại diện các thiết bị khác khi chưa có sync.

P18 không gửi tên khách, số điện thoại, email, ghi chú, công thức tóc, chi tiết dòng hóa đơn, mã thanh toán hoặc địa chỉ nhà cung cấp lên Gemini.

## Giới hạn và vận hành

- Callable Function kiểm tra Firebase Auth + Membership Owner ở server; App Check vẫn bắt buộc.
- Rate limit mặc định 30 yêu cầu/phút/UID để chống lạm dụng, không phải giới hạn tính năng hội thoại.
- Gemini API key chỉ ở Secret Manager; không đặt trong frontend.
- AI chỉ trả lời/đề xuất; mọi thao tác nghiệp vụ vẫn qua UI/repository hiện có.
- Employee AI chỉ được mở sau khi có Employee App và mô hình Membership đáng tin cậy.
