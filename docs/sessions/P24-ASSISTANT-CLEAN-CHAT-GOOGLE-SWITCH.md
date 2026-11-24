# P24 – Đổi tài khoản Google và tinh gọn hội thoại trợ lý
Ngày: 2026-11-24
Branch: `phase-24-assistant-clean-chat-google-switch`
Base: `phase-23-assistant-ux-account-switch`

## Mục tiêu
Giúp người dùng đổi Google account ngay từ màn hình Owner Access Control; giải thích đúng khác biệt giữa đăng nhập Google thành công và được cấp quyền Owner; làm cho hội thoại chỉ chứa nội dung trao đổi, không trộn thông báo kỹ thuật.

## Thay đổi
- Thêm thao tác **Đổi tài khoản Google** trực tiếp trên màn hình Owner Access Control. Luồng gọi Google popup với `prompt=select_account`, không bắt buộc đăng xuất trước.
- Hiển thị email và Firebase UID đang đăng nhập để đối chiếu đúng document ID trong Firestore.
- Giải thích rõ tài khoản Google đã xác thực nhưng chưa có membership Owner; không tự cấp quyền từ client.
- Sửa phản hồi chào hỏi thông thường: “Xin chào”, “Chào bot”, “Hello”… được trả lời như hội thoại tự nhiên, không tạo báo cáo “hôm nay”.
- Bỏ dòng giải thích nguồn IndexedDB khỏi nội dung tin nhắn trả lời. Nguồn dữ liệu được hiển thị thành ghi chú riêng bên ngoài bong bóng chat.
- Đưa trạng thái Gemini chưa cấu hình/không kết nối ra ngoài hội thoại; câu trả lời nội bộ không còn bị nối thêm thông báo kỹ thuật.
- Giữ phần báo cáo, số liệu nghiệp vụ và nội dung tư vấn thật trong câu trả lời.
- Sửa `.firebaserc` để Firebase CLI mặc định trỏ đúng project ứng dụng `salonquyen-f21fa`, thay cho alias cũ `salon-quyen`. Việc này tránh thao tác CLI nhầm Firebase project; không deploy cấu hình nào.

## Bảo mật và dữ liệu
- Không nới lỏng Firestore Rules.
- Không tự tạo hoặc sửa `memberships/{uid}` từ trình duyệt.
- Quyền Owner vẫn yêu cầu document ID đúng Firebase UID, `status=active`, `role=owner`, `salonId` hợp lệ.
- Đổi tài khoản chỉ thay phiên Firebase Authentication; AuthGate vẫn xác minh membership theo UID mới trước khi render Owner workspace.
- Không xóa IndexedDB, localStorage, dữ liệu salon hoặc trí nhớ AI.
- Không thay đổi dữ liệu nghiệp vụ hoặc Firebase deployment.

## Kiểm thử
- Bổ sung unit test cho câu chào tiếng Việt và tiếng Anh.
- GitHub Actions run `45321044138` trên commit `6bddc5bcaa7a25443d42d678fac7806bcba8b0b3`: Typecheck PASS, ESLint PASS, Unit tests PASS, Production/PWA build PASS, Cloud Functions dependency install PASS và Functions build PASS.
- Lượt CI đầu phát hiện thiếu destructuring `uid` ở màn hình Owner Access; đã sửa và lượt CI kế tiếp PASS toàn bộ.
- Cần kiểm tra thực tế trên Android: chọn tài khoản khác, kiểm tra membership theo UID hiển thị, xác nhận tài khoản được cấp quyền vào app và tài khoản chưa được cấp quyền vẫn bị chặn.
- Cần kiểm tra hội thoại: “Xin chào”, báo cáo doanh thu, câu hỏi tư vấn khi Gemini chưa kết nối; xác nhận chẩn đoán nằm ngoài bong bóng chat.

## Lưu ý cấp quyền tài khoản thứ hai
Đổi tài khoản không đồng nghĩa tự động cấp quyền Owner. Nếu tài khoản thứ hai cần vào cùng salon, quản trị viên phải tạo/duyệt document `memberships/{UID-thứ-hai}` trong đúng Firebase project `salonquyen-f21fa`, với `status: active`, `role: owner`, `salonId` là tenant salon đã được phê duyệt. Firestore Rules hiện cố ý cấm client tự ghi membership.
