# P23 – Assistant UX, hội thoại và chuyển đổi tài khoản
Ngày: 2026-11-24
Branch: `phase-23-assistant-ux-account-switch`
Base: `phase-22-salon-brain-core`

## Mục tiêu
Cải thiện hội thoại AI tiếng Việt, tự động theo dõi tin nhắn mới, bổ sung lối đăng xuất/đổi tài khoản Google và loại bỏ nguy cơ hiển thị workspace cũ trong lúc UID tài khoản đang thay đổi.

## Thay đổi
- Google Sign-In đặt `prompt=select_account` để người dùng chủ động chọn tài khoản mỗi lần đăng nhập.
- Bổ sung nút Đăng xuất rõ ràng tại header, giữ nút ở hồ sơ sidebar và màn hình Owner Access Control. Đăng xuất chỉ kết thúc phiên Firebase Auth, không xóa IndexedDB/localStorage.
- AuthGate gắn kết quả membership với UID được xác minh; trong lúc đổi UID hoặc đang xác minh sẽ không render Owner workspace cũ. Vẫn fail-closed và chỉ chấp nhận membership active + role owner + salonId hợp lệ.
- Chat theo dõi vị trí cuộn: tự cuộn khi người dùng đang ở cuối; nếu người dùng đọc lịch sử cũ thì không giật màn hình, thay vào đó hiện nút Tin nhắn mới.
- Tăng giới hạn nội dung nhập chat lên 4.000 ký tự; tăng giới hạn output Gemini để câu tư vấn có đủ không gian trình bày. Gemini vẫn tùy chọn, không quyết định quyền và không nhận nội dung trí nhớ dài hạn.
- Mở rộng parser trí nhớ với cách diễn đạt tiếng Việt tự nhiên; phân loại profile/preference/routine/project/knowledge và mở rộng câu hỏi truy xuất. Chỉ lưu khi có chỉ thị rõ ràng hoặc câu khai báo danh tính theo quy tắc hiện tại; câu nói sở thích thông thường không tự động lưu.
- Bổ sung test parser, recall và truy xuất trí nhớ.

## Bảo mật và dữ liệu
- Không thay đổi Firestore Rules, Firebase project, schema IndexedDB hoặc dữ liệu salon.
- Không xóa dữ liệu khi đăng xuất.
- Không tự cấp quyền Owner; không thay đổi membership.
- Không gửi long-term memory lên Gemini/Firebase.
- Đổi tài khoản sẽ xác minh membership theo UID mới trước khi render workspace.

## Kiểm thử
- GitHub Actions run `45317343889` trên commit `b9d9c5ab83da4888056fff611c1364c2116c85ed`: Typecheck PASS, ESLint PASS, Unit tests PASS, Production build/PWA PASS, Cloud Functions dependency install PASS và Functions build PASS.
- Một lượt CI trước đó phát hiện lỗi lint `prefer-const` trong parser; đã sửa và lượt CI cuối cùng PASS toàn bộ.
- Cần smoke test Android/Termux: cuộn tự động và đọc lịch sử, nút Tin nhắn mới, đăng xuất, chọn Google account khác, Owner hợp lệ và tài khoản không có membership.
- Chỉ xác nhận CI PASS; chưa tuyên bố runtime/mobile PASS khi chưa có kiểm tra trên thiết bị.

## Giới hạn còn lại
- Gemini vẫn là cố vấn tùy chọn; chất lượng hội thoại tư vấn phụ thuộc cấu hình Firebase AI Logic/App Check và model sẵn sàng.
- Trí nhớ dài hạn vẫn local-only theo quyết định P2P-only; chưa đồng bộ giữa các thiết bị.
