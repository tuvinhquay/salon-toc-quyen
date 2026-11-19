# Lịch sử phiên làm việc
Các phiên 01–05 được giữ nguyên ở các commit lịch sử trước đó.
## Phiên 06 – 2026-11-18 – Gộp P04 + P05
### Đã triển khai trên phase-04-05-customers-appointments-workflow
- Dexie schema version 2, migration giữ nguyên version 1, store workflowEvents.
- Repository local-first khách hàng, lịch hẹn, dịch vụ, workflow event.
- Kiểm tra salon scope ở các điểm truy cập; audit event ghi cùng transaction.
- State transition lịch hẹn; tiền cọc; snapshot khách hàng tại thời điểm đặt.
- Công thức tóc được lưu thành snapshot append-only.
- Bổ sung kiểm thử validation cho customer, appointment, service, formula và workflow.
### Chưa hoàn tất
- Chưa có UI CRUD nghiệp vụ; chưa có IndexedDB integration test trên trình duyệt.
- Chưa xác minh Firebase membership live để cấp ActorContext.
- Chưa có nhân viên, kho, P2P/cloud sync.
### Trạng thái
P04 + P05 IN PROGRESS; chưa được đánh dấu PASS.

## Phiên 07 – 2026-11-19 – Kết nối UI nghiệp vụ P04 + P05
### Đã thực hiện
- Bổ sung OwnerContext; ActorContext chỉ hình thành sau khi AuthGate xác minh membership active, role owner và salonId hợp lệ.
- Xây dựng UI quản lý khách hàng: tạo, tìm kiếm, sửa và lưu trữ hồ sơ; dữ liệu đọc/ghi qua Dexie repository.
- Xây dựng UI quản lý dịch vụ: tạo, sửa, xem danh sách; giá VND và thời lượng được kiểm tra bằng schema.
- Xây dựng UI lịch hẹn: chọn khách hàng và dịch vụ, chọn thời gian bắt đầu/kết thúc, ghi nhận tiền cọc và cập nhật trạng thái theo transition map.
- Xây dựng UI nhật ký quy trình: ghi nhận tư vấn/công đoạn và lưu snapshot công thức tóc.
- Bổ sung style responsive cho màn hình nghiệp vụ và điều hướng hiển thị danh tính Owner.
### Sửa lỗi trong kiểm thử
- CI đầu tiên phát hiện import nhầm WorkflowEventInput từ db/types; đã sửa để import type từ db/schema.
- Các lần CI sau sửa đã xác nhận Typecheck và Lint PASS; Unit tests/Production build đang chờ kết quả cuối.
### Còn tồn tại / chưa nghiệm thu
- Chưa chạy UI trên trình duyệt thực tế hoặc Termux của người dùng; chưa có IndexedDB integration test tự động.
- Chưa kiểm thử multi-tenant bằng hai salon khác nhau, không đồng bộ cloud, không mã hóa local DB và chưa backup.
- Chưa có chức năng sửa/xóa mềm lịch hẹn, hoàn tiền cọc hoặc xử lý xung đột đồng bộ.
- P04 + P05 vẫn IN PROGRESS, không đánh dấu PASS cho tới khi CI đầy đủ và runtime regression được xác nhận.

### Bổ sung sau rà soát regression
- Bắt gặp lỗi escape regex trong chuẩn hóa số điện thoại/tên tiếng Việt của repository; đã sửa và thêm unit test riêng cho hai trường hợp.
- Đã bổ sung tìm kiếm hồ sơ khách hàng theo tên/số điện thoại.
- CI trên commit trước đó đã PASS đầy đủ; commit sửa chuẩn hóa và test mới đang được xác minh lại.

## Phiên 08 – 2026-11-19 – Gộp P06 + P07
### Đã triển khai
- Dexie schema version 3: thêm employee, shift, commission, product, supplier, purchase order, inventory lot và stock movement; giữ nguyên version 1 và 2.
- Schema Zod cho hồ sơ nhân viên, ca làm, chính sách hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Repository P06: tạo/list nhân viên; tạo/list ca làm; ngăn ca trùng giờ trên cùng nhân viên; lưu chính sách hoa hồng theo nhân viên/dịch vụ hoặc toàn salon.
- Repository P07: tạo/list sản phẩm, nhà cung cấp; tạo đơn mua hàng; nhận hàng một phần/toàn phần; tạo inventory lot và stock movement, cập nhật trạng thái đơn trong cùng Dexie transaction.
- UI Owner: quản lý nhân viên, xếp ca, cấu hình hoa hồng; tạo sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Bổ sung unit tests schema cho employee, shift, commission, product, supplier, purchase order và receive batch.
### Giới hạn còn lại
- Chưa có IndexedDB integration test/browser smoke test; chưa kiểm tra UI thực tế trên Termux/Android.
- Chưa có phân quyền chi tiết theo nhân viên, tính hoa hồng thực thu, tiêu hao vật tư, điều chỉnh tồn, trả hàng hoặc kiểm kê.
- Chưa có tự động cảnh báo/đổi trạng thái lô hết hạn; cần hoàn thiện FIFO/FEFO và xác nhận nghiệp vụ.
- P06 + P07 IN PROGRESS; chỉ đánh dấu PASS sau CI và runtime regression đầy đủ.

## Phiên 09 – 2026-11-19 – Gộp P08 + P09
### Đã triển khai
- Dexie schema version 4 thêm invoices, payments, refunds, cashSessions, expenses, taxPolicies; giữ migration v1–v3.
- Zod validation cho chính sách thuế, hóa đơn, thanh toán, hoàn tiền, ca thu ngân và chi phí.
- Repository tạo hóa đơn theo snapshot; tính thuế theo policy hiệu lực và hỗ trợ giá đã gồm thuế/chưa gồm thuế.
- Phát hành hóa đơn có dòng sản phẩm sẽ trừ tồn theo FEFO; cập nhật inventory lot, stock movement, invoice và audit cùng transaction để thiếu tồn thì rollback.
- Repository thanh toán một phần/toàn phần, hoàn tiền một phần/toàn phần, mở/đóng ca thu ngân và ghi chi phí.
- Đóng ca đối soát tiền mặt theo tiền đầu ca + thu tiền mặt - hoàn tiền mặt - chi tiền mặt.
- Báo cáo tổng hợp hóa đơn, doanh số phát hành, thu, hoàn, chi phí và thu ròng.
- Owner UI: mở/đóng ca, cấu hình thuế, lập hóa đơn, thanh toán, hoàn tiền, ghi chi phí và báo cáo theo khoảng thời gian.
- CI GitHub Actions commit UI: Typecheck PASS, Lint PASS, Unit tests PASS, Production build PASS.
### Giới hạn còn lại
- Chưa có browser/IndexedDB integration test trên Android/Termux; chưa đối soát dữ liệu thực tế với nghiệp vụ salon.
- Chưa có thao tác void hóa đơn, trả hàng nhập lại kho, chia hóa đơn nhiều dòng ở UI, giảm giá cấp hóa đơn, quản lý hóa đơn điện tử hoặc kết nối cổng thanh toán.
- Báo cáo hiện tổng hợp theo ngày phát hành/thu/hoàn/chi, chưa có báo cáo lợi nhuận theo giá vốn và hoa hồng.
- P08 + P09 vẫn IN PROGRESS cho tới khi runtime regression và đối soát thực tế PASS.

## Phiên 10 – 2026-11-19 – Gộp P10 + P11
### Đã triển khai
- Dexie schema version 5: devices, changeLogs, syncConflicts, syncCursors, backupRecords.
- Repository đăng ký, duyệt, thu hồi thiết bị; ghi encrypted change log; liệt kê hàng đợi chưa đồng bộ; ghi nhận/đóng xung đột; cập nhật cursor.
- AES-GCM 256 với PBKDF2 SHA-256 (310.000 vòng), salt/IV ngẫu nhiên và authenticated additional data theo context backup/sync.
- Sync protocol mã hóa batch, xác thực salonId và peer device ID trước khi chấp nhận payload. Đây là protocol layer; chưa kết nối WebRTC/signaling.
- Backup export/restore mã hóa; SHA-256 checksum; kiểm tra schema version, tenant; merge ưu tiên revision mới hơn; replace có xác nhận rõ ràng ở UI.
- Owner UI cho đăng ký/duyệt/thu hồi thiết bị, hiển thị pending changes/xung đột và tạo/khôi phục backup.
- Unit tests cho envelope và sync protocol; CI commit b93ee77: Typecheck PASS, Lint PASS, Unit tests PASS, Production build PASS.
### Giới hạn còn lại
- Chưa có P2P WebRTC transport, signaling, peer discovery, key exchange riêng cho từng thiết bị hoặc tự động đẩy/nhận change log.
- CRUD hiện tại chưa tự động ghi change log; chưa có end-to-end sync giữa hai thiết bị.
- Chưa kiểm thử backup/restore trên IndexedDB thật, file lớn, thiết bị Android hoặc quy trình phục hồi khi mất mật khẩu.
- Chưa có cloud/Google Drive backup. Không lưu passphrase ở ứng dụng; người dùng phải tự bảo quản.
- P10 + P11 vẫn IN PROGRESS, không tuyên bố đồng bộ thiết bị hoàn tất.

## Phiên 11 – 2026-11-19 – Gộp P12 + P13
### Đã triển khai
- Firebase Cloud Function callable salonAssistant chạy server-side với Gemini 3.8 Flash; API key lấy từ Secret Manager bằng defineSecret.
- Security gates: Firebase Auth, App Check enforce, kiểm tra membership active/owner và rate limit 10 yêu cầu/phút/UID.
- Zod validate question/context; giới hạn độ dài, không lưu prompt/context; log không ghi nội dung câu hỏi.
- Owner UI Trợ lý AI gửi nội dung người dùng chủ động nhập; không tự đọc dữ liệu khách hàng, thanh toán hoặc kho.
- Firebase App Check Web qua reCAPTCHA Enterprise; nếu thiếu site key, giao diện khóa gửi câu hỏi.
- Firebase Hosting SPA rewrite + security headers; Firestore Rules deny-by-default; Functions Node 22 và deploy predeploy build.
- .env.example chỉ còn placeholder; không đưa Firebase config thật hoặc Gemini key vào Git.
- CI đã mở rộng build Cloud Functions cùng frontend.
### Còn chờ người dùng cấu hình / nghiệm thu
- Chưa nhập Firebase Web config vào .env.local, chưa tạo reCAPTCHA Enterprise site key, chưa đặt GEMINI_API_KEY trong Firebase Secret Manager.
- Chưa deploy Functions/Hosting/Firestore Rules lên project salon-quyen; chưa kiểm tra App Check token, callable, rate limit hoặc chi phí Gemini thực tế.
- P12/P13 vẫn IN PROGRESS cho đến khi hoàn tất cấu hình và smoke test trên Termux/thiết bị thật.

### Ghi chú triển khai thực tế
- Cloud Functions deploy yêu cầu gói Blaze/Cloud Billing; cần bật budget alerts và spend caps trước khi deploy.
- App Check Web cần reCAPTCHA Enterprise score-based Web key, đăng ký trong Firebase Console; không dùng localhost trong key production. reCAPTCHA Enterprise có quota miễn phí theo tháng và có thể tính phí khi vượt quota.


### Bổ sung rà soát và CI – 2026-11-19
- Kiểm tra model Gemini API: `gemini-3.8-flash` là model ID hiện hành trong tài liệu Google; giữ nguyên model ID ở Cloud Function.
- Rà soát Owner navigation và loại bỏ nhánh render `/assistant` bị lặp.
- Đồng bộ trạng thái P10–P13 trong ROADMAP thành IN PROGRESS kèm điều kiện còn thiếu; không ghi PASS cho giai đoạn chưa có runtime nghiệm thu.
- Commit `bdcd2e0`: GitHub Actions Run #44463059905 PASS đầy đủ: Typecheck, Lint, Unit tests, Production build, Cloud Functions dependency install và build.
- PR #7 cập nhật phạm vi, bằng chứng CI và các bước cấu hình còn chờ; tiếp tục giữ draft.
- Chưa deploy Firebase và chưa đưa khóa API vào repository/chat. Bước kế tiếp là đồng bộ branch P12/P13 về Termux, cấu hình `.env.local`, App Check và Gemini Secret Manager an toàn.
