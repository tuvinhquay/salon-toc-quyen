# P18 – Trợ lý AI đồng hành và lối tắt dữ liệu mẫu

## Nhánh
- `phase-18-ai-companion-demo-shortcuts`
- Base: P17 commit `b6e5ebd2587321169937ca501227df226bbd9dc1`.
- Không sửa main, không merge PR nền tảng.

## Phát hiện
- AssistantPage cũ chỉ gửi câu hỏi và context nhập tay; không đọc IndexedDB.
- Cloud Function chỉ xác minh Owner membership, App Check bắt buộc, quota 10/phút, context tối đa 4.000 ký tự.
- Dữ liệu demo đã có trong SettingsPage, nhưng lối vào bị khuất trên mobile.
- Employee App chưa được triển khai; không được dùng Employee.role cục bộ làm bằng chứng cấp quyền.

## Thay đổi P18
- Thêm FloatingAssistant robot nổi ở mọi màn hình Owner, có chuyển động nổi, nháy mắt và hiệu ứng pulse; bấm để mở trang trợ lý.
- Thêm lối tắt “Dữ liệu mẫu” cố định ở header để mở Settings; nút nạp/xóa hiện hữu vẫn dùng lại logic tenant-scoped và kiểm tra tham chiếu dữ liệu thật.
- Thêm assistant-context builder đọc Dexie theo salonId, chỉ tạo bản tóm tắt tổng hợp: khách, nhân sự, dịch vụ, lịch, tồn thấp, hóa đơn, thu, hoàn và chi phí.
- Không gửi dữ liệu định danh: tên, điện thoại, email, ghi chú, công thức tóc, chi tiết hóa đơn hoặc mã thanh toán.
- AssistantPage tự tạo snapshot trước khi gọi Gemini; người dùng vẫn có thể thêm ngữ cảnh.
- Tăng context tối đa lên 12.000 ký tự và quota chống lạm dụng từ 10 lên 30 yêu cầu/phút/UID.
- Mở rộng system instruction để AI chủ động phân tích xu hướng/rủi ro nhưng không được tự ghi/sửa/xóa hay tuyên bố đã thực hiện giao dịch.
- Tài liệu hóa ma trận quyền Owner và Employee App tương lai; chưa kích hoạt quyền AI nhân viên khi Employee App/Membership chưa có.

## Bảo mật
- AI không có quyền độc lập; server vẫn xác minh Firebase Auth, membership active + role owner + salonId.
- App Check vẫn bắt buộc; Gemini key chỉ dùng Secret Manager.
- Dữ liệu chỉ là snapshot local trên thiết bị hiện tại; chưa có cloud/P2P sync.
- Không cho AI tự thao tác ghi. Mọi thay đổi nghiệp vụ tiếp tục qua module có validation/audit.

## Cần kiểm tra
- Typecheck, lint, tests, frontend build, Functions build.
- Kiểm tra UI robot trên desktop/mobile và lối tắt Dữ liệu mẫu.
- Nạp demo, kiểm tra số liệu các module, thu hồi demo; xác minh dữ liệu thật được giữ nguyên.
- Kiểm tra assistant context theo salonId, không chứa trường PII.
- Sau CI mới có thể đánh giá bước cấu hình/deploy Gemini + App Check. Không tuyên bố AI live nếu chưa deploy.
