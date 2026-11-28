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


## Phiên 12 – 2026-11-22 – P14: Owner App polish & dữ liệu mẫu
### Đã triển khai trên phase-14-owner-app-polish-demo-data
- Bổ sung bộ dữ liệu mẫu tenant-scoped với ID có tiền tố `demo_<salonId>_`; gồm 10 nhân viên, 10 khách hàng, 6 dịch vụ, 8 lịch hẹn, 10 ca, 10 chính sách hoa hồng, 6 sản phẩm và 2 nhà cung cấp.
- Bổ sung thao tác nạp một lần, chống tạo trùng, xem số lượng và xóa riêng record có tiền tố demo của salon hiện tại.
- Bổ sung trang Cài đặt quản lý dữ liệu mẫu và nhắc rõ dữ liệu local-first, P2P chưa triển khai.
### Còn chờ
- Chạy typecheck, lint, test, build và kiểm tra CI.
- Smoke test trên Android/Termux: nạp mẫu, kiểm tra từng module, xóa mẫu và xác nhận dữ liệu thật không bị ảnh hưởng.
- Chưa đánh dấu P14 PASS trước khi có bằng chứng runtime.


## Phiên 12 – Bổ sung P14–P16 Owner App – 2026-11-22
### P14 – Dữ liệu mẫu và công cụ quản trị
- Sửa Dexie transaction cho cả luồng nạp và xóa: truyền danh sách bảng dưới dạng array, không spread thành nhiều tham số vượt overload.
- Mở rộng dữ liệu mẫu: 10 nhân viên, 10 khách, 6 dịch vụ, 8 lịch, 10 ca, 10 hoa hồng, 6 sản phẩm, 2 nhà cung cấp, 2 PO đã nhận, 6 inventory lots và 6 stock movements.
- Mỗi bản ghi có ID `demo_<salonId>_...`; các bảng đều có salonId; xóa lọc cả salonId và prefix ID.
### P15 – Dashboard
- Thay dashboard tĩnh bằng số liệu Dexie thật: lịch hẹn hôm nay, số khách, nhân viên active, sản phẩm, cảnh báo tồn thấp và thu ròng tháng hiện tại.
- Thêm danh sách lịch hẹn hôm nay và cảnh báo tồn theo ngưỡng cấu hình sản phẩm.
### P16 – Nhân sự và kho
- Bổ sung chỉnh sửa hồ sơ nhân viên và chuyển trạng thái active/inactive, giữ nguyên lịch sử nhân viên.
- Bổ sung nhãn cảnh báo nhập hàng khi tồn khả dụng <= minimumStock.
### Quy trình xác nhận
- CI các commit đầu phát hiện lỗi Dexie transaction và import icon không dùng; đã sửa trên branch. Cần chờ CI mới nhất để xác nhận TypeScript, lint, tests, build và Functions.
- Cần chạy trên Android/Termux: nạp mẫu, xem dashboard/nhân sự/kho/POS/báo cáo, chỉnh sửa nhân viên, chuyển inactive, xóa mẫu; xác minh dữ liệu thật không đổi.
- Chưa đánh dấu PASS, chưa merge PR, không deploy Hosting/Functions trong phiên này.

- Hoàn thiện thêm guard xóa mẫu: bảo vệ workflow events của lịch hẹn mẫu và các lô tồn thật tham chiếu đơn mua mẫu; không để lại lịch sử quy trình mồ côi.

### Trạng thái xác thực P14–P16 tại 2026-11-22
- Commit `e5d95e0` đã PASS toàn bộ CI: Typecheck, Lint, Unit tests, Production Build/PWA, Functions dependency install và Functions build.
- Sau khi tăng cường kiểm tra tham chiếu trước cleanup, commit `c3c35db` đã PASS Typecheck, Lint và Unit tests; Build/PWA và Functions đang được xác nhận lại.
- Chưa nghiệm thu runtime trên Android/Termux; chưa merge PR #8; không thay đổi main.


## Phiên 13 – 2026-11-22 – P17: Ổn định và nghiệm thu Owner App
### Nhánh làm việc
- Tạo nhánh phase-17-owner-app-acceptance từ commit P14–P16 25be9737686600b68e1c0df58f6b430744086dfa.
- Giữ nguyên main, PR #8 và PR #9; không merge chồng nhánh.

### Rà soát và thay đổi
- Rà soát AuthGate, điều hướng Owner, Dexie schema, module lịch hẹn/quy trình, nhân sự/kho, thu ngân/báo cáo và cài đặt dữ liệu mẫu.
- Phát hiện AuthGate chỉ cho đăng xuất khi không xác minh được membership; chưa có cách thử lại sau lỗi mạng hoặc sau khi quyền Owner được cấp.
- Bổ sung nút Thử kiểm tra lại quyền Owner; mỗi lần thử lại đọc lại memberships/{uid} từ Firestore.
- Giữ nguyên fail-closed: chỉ cho vào Owner workspace khi membership tồn tại, status=active, role=owner và salonId hợp lệ. Không cho client tự tạo/cấp quyền.
- Tạo checklist nghiệm thu thủ công Android/IndexedDB cho các nghiệp vụ cốt lõi.

### Còn chờ kiểm chứng
- Chạy npm run typecheck, npm run lint, npm run test, npm run build trên Termux.
- Smoke test đăng nhập, refresh quyền, CRUD, lịch hẹn, quy trình, nhân viên, kho, POS, báo cáo, dữ liệu demo.
- Kiểm tra backup/restore mã hóa và xác minh dữ liệu thật không bị tác động.
- Chưa có bằng chứng runtime nên P17 vẫn IN PROGRESS; chưa merge và chưa deploy.


## Phiên 14 – 2026-11-22 – P18: AI đồng hành và dữ liệu mẫu
### Đã triển khai trên phase-18-ai-companion-demo-shortcuts
- Kiểm tra AssistantPage và xác nhận bản cũ chỉ gửi prompt nhập tay, không tự đọc dữ liệu Dexie.
- Thêm robot AI nổi trên mọi trang Owner và lối tắt Dữ liệu mẫu ở header.
- Thêm bộ tạo ngữ cảnh AI theo salonId và Owner UID, chỉ tổng hợp số liệu lịch hẹn, khách, nhân viên, dịch vụ, kho và tài chính tháng hiện tại; loại bỏ trường định danh cá nhân.
- Nối AssistantPage với snapshot tự động; giữ quyền Owner, App Check và Secret Manager ở server.
- Nới context 12.000 ký tự và quota fair-use 30 yêu cầu/phút/UID.
- Ghi tài liệu ma trận quyền AI; Employee App chưa có nên không cấp quyền AI nhân viên bằng dữ liệu role cục bộ.
### Còn chờ
- CI typecheck/lint/test/build frontend và Cloud Functions.
- Smoke test robot, shortcut dữ liệu mẫu, seed/clear demo và bảo toàn dữ liệu thật trên Android.
- Cấu hình/deploy Gemini Function, Secret Manager và App Check để gọi AI thực tế.
- P18 chưa PASS, chưa merge.


## Phiên 15 – 2026-11-23 – P19–P21: Trợ lý học hỏi và Gemini cố vấn
### Nhánh làm việc
- Tạo nhánh `phase-19-local-learning-assistant` từ `phase-18-ai-companion-demo-shortcuts`; không sửa main, không merge các PR nền tảng.

### P19 – Trợ lý nội bộ
- Thay UI gọi Cloud Functions bằng chat local-first, xử lý câu hỏi tiếng Việt về tài chính, lịch hẹn, khách hàng, dịch vụ, nhân viên và kho.
- Tính số liệu trực tiếp từ Dexie theo salonId và Owner UID; phân biệt doanh thu hóa đơn, tiền đã thu, hoàn tiền, chi phí và thu ròng; loại hóa đơn void.
- Dùng ranh giới ngày/tháng/năm theo Asia/Ho_Chi_Minh. Không xếp hạng nhân viên khi dữ liệu chưa có employeeId liên kết.
- Thêm test cho bộ nhận diện ý định và mốc thời gian Việt Nam.

### P20 – Bộ nhớ học hỏi
- Lưu thống kê thói quen theo salonId và Owner UID: số lần hỏi theo chủ đề và khoảng thời gian. Không lưu prompt nguyên văn hoặc PII. Có chức năng xóa bộ nhớ riêng.

### P21 – Gemini cố vấn
- Tích hợp Firebase AI Logic SDK với Gemini Developer API model `gemini-3.8-flash`; gọi khi cần tư vấn/giải thích, không gọi cho mọi phép tính.
- Chỉ gửi số liệu tổng hợp đã lọc; không dùng Cloud Functions hoặc nhúng Gemini API key. Local bot vẫn chạy khi Gemini chưa bật hoặc không kết nối.
- Cập nhật ma trận quyền AI và CI trigger cho nhánh P19.

### Còn chờ kiểm chứng
- GitHub Actions: typecheck, lint, unit tests, production build/PWA và Functions CI regression.
- Termux: đồng bộ nhánh, chạy toàn bộ lệnh kiểm tra, sửa mọi lỗi và chạy lại regression.
- Android: đăng nhập Owner, chat local, các câu hỏi hôm nay/tháng/năm, kiểm tra bộ nhớ sau reload và thao tác xóa.
- Firebase Console: bật Firebase AI Logic với Gemini Developer API Free Tier, kiểm tra App Check; sau đó thử câu hỏi tư vấn live.
- Kiểm tra quyền Owner, không rò dữ liệu tenant, không gửi PII, không để Gemini tự sửa dữ liệu.

### Trạng thái
P19–P21: GitHub Actions run #45134545399 PASS toàn bộ Typecheck, Lint, Unit tests, Production Build/PWA, Cloud Functions dependency install và Functions build. Còn chờ Termux/Android smoke test, kiểm tra IndexedDB/localStorage, bật Firebase AI Logic + App Check và kiểm thử Gemini live. Chưa nghiệm thu tổng thể.


## Phiên 16 – 2026-11-23 – P22: Salon Brain Core và chốt P2P-only
- Chủ tiệm chọn phương án A: P2P-only, không lưu dữ liệu salon/trí nhớ AI lên cloud. Firebase chỉ xác thực và bảo vệ quyền hệ thống.
- Tạo Dexie schema version 6 với bảng `assistantMemories`, lưu trí nhớ dài hạn theo salonId + Owner UID; không sửa/xóa dữ liệu cũ và giữ nguyên migration v1–v5.
- Thêm loại trí nhớ profile, preference, routine, project, knowledge; lưu metadata nguồn, revision, trạng thái active/archived và `syncState=local_only`.
- Thêm parser cho lệnh ghi nhớ tường minh, nhận diện câu hỏi truy xuất trí nhớ, tìm các mục liên quan và trả lời từ trí nhớ local.
- Owner có thể xem và lưu trữ từng mục trí nhớ; thao tác tạo/lưu trữ ghi audit event.
- Không gửi trí nhớ dài hạn đến Firebase hoặc Gemini. Chưa có P2P transport nên chưa đồng bộ giữa các thiết bị; UI phải nói rõ giới hạn này.
- Cập nhật roadmap P23–P29; ghi rõ P2P-only, không cloud signaling/storage, và giới hạn phục hồi khi tất cả thiết bị bị mất.
- Chờ CI và kiểm thử Termux: typecheck, lint, unit tests, build; smoke test lưu/đọc/lưu trữ trí nhớ và kiểm tra migration Dexie v5→v6.
- P22 hiện IMPLEMENTED ON BRANCH, chưa PASS, chưa merge.


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

# P24 – Đổi tài khoản Google và tinh gọn hội thoại trợ lý
Ngày: 2026-11-24
Branch: `phase-24-assistant-clean-chat-google-switch`
Base: `phase-23-assistant-ux-account-switch`

## Thay đổi
- Thêm nút Đổi tài khoản Google trực tiếp trên màn hình Owner Access Control; mở hộp chọn Google account mà không cần đăng xuất trước.
- Hiển thị email và Firebase UID để đối chiếu hồ sơ membership.
- Giải thích rõ tài khoản đã đăng nhập Google nhưng chưa có Owner membership; không tự cấp quyền.
- Câu chào hỏi được trả lời tự nhiên, không tạo báo cáo hôm nay.
- Tách thông tin nguồn IndexedDB và trạng thái Gemini khỏi bong bóng hội thoại.
- Không nối thông báo lỗi/kết nối Gemini vào nội dung câu trả lời nội bộ.
- Sửa `.firebaserc` mặc định sang đúng project `salonquyen-f21fa`; alias cũ `salon-quyen` không khớp cấu hình app.
- Thêm unit test cho câu chào hỏi.

## Bảo mật
- Giữ nguyên Firestore Rules: client chỉ đọc membership của chính UID; không được ghi membership.
- Tài khoản thứ hai muốn truy cập phải được cấp document `memberships/{uid}` đúng UID, `status=active`, `role=owner`, `salonId` hợp lệ trong đúng project.
- Không deploy Firebase, không xóa dữ liệu cục bộ, không tự cấp quyền Owner.

## Kiểm thử
- GitHub Actions run `45321044138` trên commit `6bddc5bcaa7a25443d42d678fac7806bcba8b0b3`: Typecheck, ESLint, Unit tests, Production/PWA build, Cloud Functions dependency install và Functions build đều PASS. Một lỗi typecheck ban đầu do thiếu destructuring UID đã được sửa trước lượt CI PASS.
- Cần smoke test Android cho đổi tài khoản và hội thoại; chưa đánh dấu runtime PASS trước khi người dùng xác nhận.

# P25 – Business Brain và Tenant riêng cho từng chủ salon
Ngày: 2026-11-24
Branch: `phase-25-business-brain-multitenant`
Base: `phase-24-assistant-clean-chat-google-switch`

## Đã triển khai trên branch
- Mở rộng bộ nhận diện câu hỏi nội bộ cho doanh thu, tài chính, lịch hẹn, khách hàng, dịch vụ, nhân viên, tồn kho và tìm sản phẩm.
- Thêm kỳ báo cáo quý theo múi giờ Việt Nam; giữ ngày/tháng/năm.
- Báo cáo tổng quan đối chiếu hóa đơn, tiền thu, hoàn tiền, chi phí, lịch, dịch vụ, khách hàng và tồn kho.
- Tra cứu sản phẩm theo tên/SKU/danh mục và tồn khả dụng.
- Xếp hạng ca làm đã hoàn thành theo giờ và số ca; không gán nhầm thành doanh thu/năng suất dịch vụ.
- Trả lời FAQ về khả năng trợ lý và nguồn gốc trợ lý bằng bộ máy nội bộ.
- Thêm memory category `shortcut`, cho phép chủ tiệm dạy câu hỏi bằng cú pháp “Hãy ghi nhớ thêm. …”; câu hỏi tương tự được ánh xạ sang truy vấn nghiệp vụ cục bộ.
- Thêm callable `createOwnerSalon`: mỗi Google UID mới có thể tạo đúng một tenant; Admin SDK tạo salon + membership trong transaction. Client không được tự ghi membership.
- AuthGate thêm luồng tạo không gian salon riêng cho tài khoản chưa có membership; membership sai trạng thái vẫn bị chặn.
- Firestore Rules chỉ cho owner đọc metadata salon thuộc membership của chính mình; vẫn cấm client ghi membership/salon.
- Cập nhật docs/DATA_SCHEMA.md và ghi chú Phase 25.

## Giới hạn và bảo mật
- Không xóa/migrate dữ liệu hiện tại, không đổi membership hiện tại của owner cũ.
- Tài khoản mới sẽ có salonId riêng; dữ liệu IndexedDB được phân vùng theo salonId. Trí nhớ gắn salonId + ownerId.
- Chưa đồng bộ IndexedDB/memory sang thiết bị khác.
- Doanh thu theo nhân viên chưa thể tính cho đến khi có employee attribution ở dịch vụ/hóa đơn; xếp hạng hiện tại chỉ là giờ/ca đã hoàn thành.
- Callable mới cần deploy lên Firebase `salonquyen-f21fa` trước khi người dùng mới có thể tự tạo tenant.
- Chưa có invitation để nhiều nhân viên cùng tham gia một salon.

## Kiểm thử
- Bổ sung unit tests cho quý, câu hỏi shortcut, FAQ khả năng và creator.
- Chờ GitHub Actions typecheck/lint/test/build/Functions build.
- Cần kiểm thử thực tế hai tài khoản Google độc lập sau khi deploy callable/rules; chưa đánh dấu runtime PASS.


## Phiên 17 – 2026-11-24 – P26: Tinh gọn màn hình Owner onboarding
- Tạo branch `phase-26-owner-onboarding-clean-ui` từ P25; không sửa main và không merge PR trước đó.
- Thiết kế lại màn hình tài khoản chưa có salon: email Google, tên salon, nút tạo salon, đổi tài khoản và đăng xuất được bố trí thành các nhóm rõ ràng.
- Ẩn Firebase UID trong mục “Thông tin kỹ thuật” thu gọn để giao diện bớt rối.
- Chuẩn hóa lỗi callable tạo salon thành thông báo tiếng Việt có hướng dẫn; không hiển thị mã lỗi thô như `internal [0]`.
- Giữ fail-closed: chỉ membership active + role owner + salonId hợp lệ mới được vào Owner workspace; không cấp quyền từ client.
- Không thay đổi Firestore Rules, Firebase project, membership hiện tại hoặc dữ liệu local.
- Tài liệu chi tiết: `docs/sessions/P26-OWNER-ONBOARDING-CLEAN-UI.md`.
- Chờ CI và kiểm tra trên Termux/Android. Tạo salon thật vẫn phụ thuộc callable `createOwnerSalon` được deploy đúng project `salonquyen-f21fa`; chưa tuyên bố runtime PASS.


## Phiên 18 – 2026-11-24 – P27: Bàn giao ứng dụng, bỏ phụ thuộc Cloud Functions
- Tạo nhánh `phase-27-owner-handover-no-functions` từ P26; giữ nguyên P26 và PR #18, không merge tự động.
- Tách tài khoản phát triển `hoananhtien1@gmail.com` khỏi tài khoản chủ tiệm; người nhận đăng nhập Google UID riêng và tạo tenant riêng.
- Thay callable `createOwnerSalon` bằng Firestore writeBatch tạo đồng thời `salons/{salonId}` và `memberships/{uid}`.
- Firestore Rules yêu cầu Google sign-in, UID tự khớp, membership chưa tồn tại, salon/membership được tạo trong cùng batch và ownerUid/salonId khớp nhau. Client không thể tự sửa role, cập nhật hoặc xóa membership/salon.
- Gỡ Firebase Functions SDK export khỏi frontend; bỏ Functions config trong firebase.json, bỏ bước Functions CI và xóa source/package/tsconfig Functions không còn được dùng.
- Giữ nguyên local assistant, assistant brain, IndexedDB/Dexie, trí nhớ salon, Firebase AI Logic Gemini tùy chọn, module lịch hẹn/nhân viên/kho/POS/báo cáo/backup.
- Không deploy Firebase, không thay đổi dữ liệu/membership hiện có, không xóa tenant cũ. Firestore Rules mới cần được triển khai riêng trước khi chủ tiệm đăng ký.
- Cần xác nhận CI, Termux typecheck/lint/test/build, kiểm thử Rules bằng emulator hoặc project test, smoke test hai tài khoản và tenant isolation. P27 chưa PASS.


## Phiên 19 – 2026-11-24 – Kiểm thử tenant isolation trước bàn giao
- Tạo nhánh `phase-28-tenant-isolation-handover` từ commit P27 `f3bc440a4096b3d02f4aa6e5e2f9d36fe4b223b1`; không sửa main, không merge PR #19 và không thay đổi Firebase.
- Xác nhận P27 Firestore Rules đã được người dùng triển khai thành công lên project `salonquyen-f21fa`; chỉ triển khai Rules, chưa triển khai Hosting.
- Rà soát AuthGate: mỗi tài khoản thiếu membership tạo salonId ngẫu nhiên và membership theo UID riêng trong cùng batch; tài khoản đã có membership không được ghi đè.
- Rà soát Dexie/repositories: dữ liệu nghiệp vụ được giữ local-first và truy vấn theo salonId; thao tác sửa hồ sơ cũ kiểm tra salonId trước khi ghi; trí nhớ dài hạn dùng cặp salonId + ownerId.
- Thêm regression tests `tests/tenant-isolation.test.ts` để khóa các điều kiện trên và ngăn hồi quy khi chuyển tài khoản.
- Không xóa IndexedDB, không xóa hoặc đổi `memberships/{uid cũ}`, không tạo collection mới, không sửa Firestore Rules.
- GitHub Actions run `45379133999` PASS: Typecheck, ESLint, Unit tests và Production build/PWA. Còn chờ Termux regression và Android smoke test; chưa đánh dấu runtime PASS.
- Sau khi kiểm thử tự động đạt, hướng dẫn người dùng đăng nhập Google mới, tạo salon mới và xác nhận salonId mới; kiểm tra dữ liệu cũ vẫn được giữ nguyên và không xuất hiện trong workspace mới.


## Phiên 20 – 2026-11-24 – Termux validation và mở giao diện PWA
- Người dùng checkout đúng nhánh `phase-28-tenant-isolation-handover-v2`; pull báo Already up to date.
- Kết quả Termux: `npm run typecheck` PASS; `npm run lint` 0 errors / 15 warnings (React Hook dependencies và Fast Refresh); `npm run test` PASS – 11 files, 42 tests; `npm run build` PASS, Vite tạo PWA service worker.
- Build có cảnh báo Rollup annotation trong Zod dependency và chunk JavaScript 1,246.41 kB (>500 kB); không chặn build.
- `git diff --check` không in lỗi, xem là PASS.
- Tổng hợp với GitHub Actions run `45379618184`: TypeScript, ESLint, unit tests, production build/PWA đều PASS.
- Chưa chạy app trên browser, chưa smoke test tài khoản Google mới, chưa deploy Hosting và chưa merge PR #21.
- Hướng dẫn xem giao diện: chạy `npm run dev -- --host 0.0.0.0` trong Termux, mở `http://127.0.0.1:5173` trên trình duyệt cùng điện thoại. Dừng server bằng Ctrl+C.


## Phiên 19 – 2026-11-24 – Phase 29: Trợ lý nghiệp vụ và báo cáo trực quan
- Tạo nhánh `phase-29-assistant-natural-language-and-configurable-analytics` từ `phase-28-tenant-isolation-handover-v2`.
- Tra cứu hồ sơ nhân viên local theo tên/số điện thoại, báo cáo ngày vào làm, thâm niên, ca đã hoàn thành và số giờ; không bịa doanh thu cá nhân khi chưa có liên kết employee attribution.
- Bổ sung xếp hạng khách theo lịch đặt, chi tiêu hóa đơn và số lượng sản phẩm đã mua trong kỳ.
- Đổi lời chào trợ lý sang xưng hô tự nhiên; lấy tên hiển thị Google, không dùng email làm tên.
- Thêm học từ vựng theo chỉ dẫn tường minh “Hãy ghi nhớ từ … nghĩa là …”; áp dụng alias vào câu hỏi sau, lưu local-only theo tenant/Owner.
- Giữ tra cứu hồ sơ nhân viên trên thiết bị, không gửi dữ liệu cá nhân lên Gemini.
- Báo cáo có biểu đồ tiền thu/hoàn tiền/chi phí từ Payment/Refund/Expense, bộ lọc nhanh ngày/tháng/quý/năm và bucket ngày/tháng.
- Bổ sung unit tests cho intent tiếng Việt, memory vocabulary, chart buckets, customer groups/custom fields và chặn bulk archive xuyên tenant.
- Dexie v7 thêm customerGroups; Customer/Product lưu customFields tùy chỉnh trực tiếp trong record.
- Owner có thể tạo/sửa/lưu trữ nhóm khách theo tháng/quý/tùy chỉnh, gắn nhóm vào hồ sơ khách hàng; sản phẩm có thể sửa/ngừng/kích hoạt mà không xóa lịch sử.
- Thêm lưu trữ hàng loạt khách hàng trong UI và bot chat: preview hồ sơ, xác nhận tường minh, transaction/audit; chỉ lưu trữ, không xóa hóa đơn/thanh toán.
- Nâng backup mã hóa lên schema v7, gồm customerGroups và assistantMemories; restore backup cũ chỉ thay các bảng có trong tệp.
- Tạo tài liệu chi tiết `docs/sessions/P29-ASSISTANT-REPORTS-UPGRADE.md`; cập nhật `docs/ROADMAP.md`.
- POS đã thêm chọn nhân viên trên từng dòng hóa đơn; trợ lý tính doanh số gộp dịch vụ/sản phẩm, số khách có hóa đơn và số sản phẩm bán từ các dòng được gán. Dữ liệu lịch sử chưa có phân công không được suy đoán; hoàn tiền chưa phân bổ theo nhân viên.
- Còn thiếu: bot chưa tự tạo/sửa sản phẩm hoặc hồ sơ; kiểm thử CI cuối và Android runtime.
- Không thay Firestore Rules, Firebase Auth hoặc Membership; Dexie nâng lên v7 có migration bổ sung customerGroups, không xóa bảng/dữ liệu cũ. Không deploy Firebase, không merge.
- Phase 29 chưa PASS cho tới khi CI, Termux và Android smoke test đạt.


## Phiên 20 – 2026-11-25 – Phase 30: Thay bộ dữ liệu mẫu bằng mô phỏng 5 tháng
- Đọc trạng thái mới nhất của repo: P29 branch/PR #22 vẫn Draft; tạo branch P30 từ P29, không merge hoặc deploy.
- Thay `src/db/demo-data.ts`: bộ dữ liệu giả lập 5 tháng lịch gần nhất, tự cập nhật phạm vi; 120 khách, 10 nhân viên, ca làm, lịch hẹn, 8 dịch vụ, 12 sản phẩm, 4 nhà cung cấp, đơn nhập/lô/xuất kho, hóa đơn/thu tiền/hoàn tiền, ca thu ngân, chi phí và giá vốn.
- Khách hàng có custom fields theo khu vực Ngã Giao / TP.HCM; tất cả danh tính và liên hệ là giả lập, số điện thoại mẫu không hợp lệ để tránh sử dụng liên hệ thật.
- Thay phần UI mẫu cũ trong Settings bằng tạo/thay mới dataset 5 tháng, xem số lượng và xóa dataset.
- Thay/xóa chỉ record có tiền tố demo_<salonId>_; transaction và kiểm tra tham chiếu ngăn xóa khi giao dịch thật đang phụ thuộc vào dữ liệu mẫu.
- Thêm `tests/demo-data.test.ts` cho khoảng thời gian rolling 5 tháng và ranh giới năm.
- Tạo `docs/sessions/P30-FIVE-MONTH-DEMO-DATA.md` và cập nhật ROADMAP.
- CI chưa chạy/đang chờ PR; chưa được đánh dấu PASS. Cần kiểm tra typecheck, lint, tests, production build và Termux/Android acceptance. Không merge, không deploy.


### Kết quả CI P30 – 2026-11-25
- CI run 45512975364 trên commit code `679e207746eedab3aebb0370372fc9e7232dc154`: Typecheck PASS, ESLint PASS, 13/13 test files, 53/53 tests PASS, Production build/PWA PASS.
- Test bundle xác nhận 120 khách giả lập, 10 nhân viên, 8 dịch vụ, 12 sản phẩm, 288 hóa đơn, 5 PO, 60 lots; hóa đơn và payment liên kết, tổng hóa đơn khớp các dòng, tồn kho = nhập - xuất.
- Các lần CI đầu phát hiện lỗi tham chiếu và một assertion test sai; đã sửa, CI cuối cùng PASS. Không che lỗi hoặc bỏ test.
- P30 còn chờ Owner kiểm tra thực tế trên Termux/Android; PR #23 vẫn Draft, không merge/deploy.


### Lưu ý vận hành bổ sung P30
- Thêm cảnh báo rõ trong Settings: dataset được lưu trong salon hiện tại và sẽ hiển thị cộng với dữ liệu thật ở Dashboard/báo cáo. Owner chỉ nên tạo trong tenant dành cho demo hoặc chấp nhận báo cáo bị trộn; dữ liệu thật vẫn không bị xóa.
- Không tạo dataset demo trên salon đang dùng báo cáo tài chính thật nếu cần số liệu thuần thực tế.


## Phiên tiếp theo – 2026-11-25 – Hotfix IndexedDB object store
- Owner báo lỗi khi nhấn tạo dataset: `Failed to execute 'objectStore' on 'IDBTransaction': The specified object store was not found`.
- Xác định transaction seed sử dụng nhiều Dexie tables; một số IndexedDB v7 đã tồn tại có thể thiếu object store do schema thay đổi trong cùng version number. Lỗi xảy ra trước khi dữ liệu demo được ghi; không cần xóa IndexedDB.
- Tạo branch `fix-indexeddb-store-upgrade-p30` từ P30.
- Nâng schema Dexie lên version 8, tái khai báo đầy đủ stores/indexes từ v7 để browser tự bổ sung store thiếu, không xóa records.
- Thêm `docs/sessions/FIX-INDEXEDDB-OBJECT-STORE-P30.md` và cập nhật ROADMAP.
- Chưa CI, chưa Android acceptance, chưa PR/merge/deploy. Tiếp tục kiểm tra CI rồi hướng dẫn Owner cập nhật branch hotfix.

## Phiên tiếp theo – 2026-11-25 – Fix Dexie transaction demo seed
- Owner xác nhận vẫn lỗi trên app local Termux, branch `fix-indexeddb-store-upgrade-p30`, sau hotfix schema v8.
- Rà soát `src/db/demo-data.ts`, phát hiện transaction seed và clear truyền `[...demoTables]` như một argument. Dexie cần các Table arguments được spread; sửa thành `...demoTables` ở cả hai transaction.
- Tạo branch `fix-demo-seed-dexie-transaction-tables` từ head PR #24; sửa `src/db/demo-data.ts`.
- Cần CI, cập nhật hướng dẫn và kiểm tra Owner trên local. PR #24 vẫn Draft; chưa merge/deploy.


## P30 hotfix correction – 2026-11-25
- Owner chạy Termux và xác nhận commit transaction spread không typecheck: Dexie 4 không cho spread 19 bảng thành 19 arguments; API hỗ trợ array of tables.
- Root cause runtime cụ thể: `assertNoRealReferences()` truy vấn `salonDb.workflowEvents` trong transaction, nhưng bảng này chưa nằm trong danh sách scope.
- Đã sửa cả seed/clear transaction thành array `[..., salonDb.workflowEvents]`, chỉ thêm workflowEvents vào scope; không xóa/ghi bảng này.
- Typecheck, lint, unit tests, build và Owner runtime test phải chạy lại. Không merge/deploy trước khi xác nhận.


## Phase 31 – Assistant intent routing/search – 2026-11-25
- Branch: `phase-31-assistant-intent-routing-search-p30`, base `fix-demo-seed-dexie-transaction-tables` (giữ P30 và hotfix Dexie v8 trong lịch sử branch).
- Sửa lỗi trong ảnh Owner: câu có tên khách hàng không còn bị trả báo cáo tổng hợp hôm nay; tra cứu tên khách trả hồ sơ đúng khách và chỉ số tổng hóa đơn/lịch hẹn.
- Hỗ trợ tên đầy đủ, tên một phần, số điện thoại; khách archived bị loại; kết quả mơ hồ được trả danh sách để Owner chọn, không tự đoán.
- Xếp hạng khách được tách theo lịch hẹn, chi tiêu hóa đơn hoặc số lượng sản phẩm; hỏi lại nếu không có hoặc có nhiều tiêu chí.
- Sửa fallback tra cứu nhân viên: truy vấn hồ sơ không tìm thấy không bị chuyển sang thống kê ca/năng suất.
- Thêm tests cho customer lookup intent và dữ liệu local; cần CI + runtime Termux/Android trước nghiệm thu.
- Không sửa Gemini, không thêm khả năng ghi dữ liệu từ chat, không merge/deploy.

## Phase 32 – Assistant product writes & salon invoice print – 2026-11-25
- Branch: `phase-32-assistant-write-actions-and-salon-invoice`; base `phase-31-assistant-intent-routing-search-p30`.
- Added product sale price field to Product model/input schema/repository and P30 demo product seed. Existing records may omit it and UI uses previous demo custom-field price as compatibility fallback.
- Inventory UI exposes sale price; POS product selection loads catalog sale price instead of defaulting to 0.
- Added `createProductWithOpeningStock`: tenant-checked, duplicate SKU protected, atomic product + initial lot + receipt movement + audit event creation.
- Assistant product creation by name/SKU/price asks for initial quantity and unit cost, previews details and waits for explicit “XÁC NHẬN”; cancel is supported. Assistant price update by exact SKU also requires confirmation.
- Added printable salon invoice HTML: A4 print/PDF, salon ornament, editable local salon contact/bank profile, customer phone, employee snapshots, invoice lines, taxes, discount, payments/refunds/net balance, care note and signatures. Each recent invoice has “Xem / In hóa đơn”.
- Demo invoice data from P30 is used directly; demo products carry sale price. Print clearly states internal receipt is not an official tax e-invoice.
- Added print tests, schema tests, demo price assertions. CI + owner Termux/Android test pending.
- No merge/deploy.

- CI run #409 (`45582461715`, commit `9ac51e52c296faa6b7d5f48cc2b02a722643a2dc`): PASS – Typecheck, Lint, Unit tests, Production build/PWA.
- Owner Termux/Android smoke test and print-to-PDF acceptance: pending. PR #28 remains Draft; no merge/deploy.


## Phase 33 – Luxury Emerald Glass & PWA visual foundation – 2026-11-25
- Tạo branch mới `phase-33-owner-luxury-emerald-glass-pwa-shell` từ chính xác Phase 32 HEAD `2e65f4d68925ef3786c9a5830cbff61352f42d2b`. PR #28 vẫn Draft, không merge/deploy.
- Thống nhất thiết kế: Luxury Emerald Glass – kính xanh ngọc lục bảo, vàng champagne.
- Thêm lớp video nền toàn app: `/videos/videosalo.mp4`, muted/autoplay/loop/playsInline; overlay xanh đậm giữ tương phản và gradient vẫn hiển thị nếu video chưa có.
- Sidebar desktop: cố định theo viewport, tự cuộn, hover trượt nhẹ, active route có vạch champagne và pulse chậm. Mobile: nav cuộn ngang có scroll-snap.
- Bổ sung glass surfaces cho header, card, form, assistant, auth; hỗ trợ prefers-reduced-motion và forced-colors.
- Tạo cấu trúc `public/videos/`, `public/brand/`, `public/icons/`; icon kéo cắt tóc vàng trên nền emerald. Owner cần chép file MP4 vào `public/videos/videosalo.mp4`.
- Cập nhật màu PWA manifest và khai báo SVG icons 192/512/maskable; Apple touch SVG hiện là vector, cần kiểm tra thực tế iOS và có thể cần PNG 180×180.
- Không thay đổi nghiệp vụ, auth, quyền Owner, tenant isolation, Dexie/Firebase hay routing.
- Kiểm tra còn chờ CI và runtime đa nền tảng; chưa đánh dấu PASS, chưa đóng dự án Owner, chưa bắt đầu Employee UI.

 
## Phase 34 – Owner Glass Contrast, Global Video & Invoice Deer Ornament – 2026-11-26
- Owner phản hồi Phase 33: chữ trên các bề mặt xuyên thấu bị chìm vào video/nền; video nhìn chưa rõ; muốn video hiển thị cả trang đăng nhập.
- Mục tiêu sửa: giữ Luxury Emerald Glass nhưng chữ/nhãn có màu đặc, độ tương phản cao; làm kính vẫn trong nhưng panel/form đủ sáng để đọc; giảm overlay nền và tăng mức hiển thị video có kiểm soát.
- Chuyển video nền khỏi Owner RootLayout lên root React để render xuyên suốt trước AuthGate: đăng nhập, xác minh quyền, tạo salon và Owner workspace. Tránh render video hai lần.
- Hóa đơn A4: thay hoa văn hình học bằng họa tiết đầu nai có sừng và watermark nhẹ; không thay logo nhận diện app (vẫn kéo cắt tóc).
- Branch `phase-34-owner-glass-contrast-global-video-invoice-deer`, stacked từ Phase 33; PR #29 vẫn Draft. Không merge/deploy.
- Kiểm thử CI và Owner visual acceptance còn pending.

 
## Phase 35 – Reports: 5-month demo range & visual chart – 2026-11-26
- Owner reported Reports showing 0 VND despite five-month demo net revenue ~25M; visual chart unchanged/simple.
- Code inspection: ReportsPage defaulted to today only; P30 seed covers five calendar months. This explains zero when today's dataset has no payment.
- Fix branch `phase-35-reports-five-month-data-and-visual-chart`, stacked on Phase34 visual accepted branch.
- New default range spans five-month demo data, quick preset added, quick filters trigger immediate reload, and chart replaced with a responsive SVG dashboard with readable axes/grid/legend/tooltip labels.
- Net collected card made prominent and chart data presence checked from transaction values.
- Tests/documentation added; CI and local Owner confirmation pending. No merge/deploy.

- CI build found Owner-provided `public/icons/icon.png` (~2.1 MB) exceeded Workbox's default 2 MiB precache limit. Increased `maximumFileSizeToCacheInBytes` to 3 MiB so the icon remains available offline; no icon file modification.


## Phiên 2026-11-26 – Phase 36: Ngôn ngữ thân thiện với chủ tiệm
- Owner đồng ý cải thiện ngôn ngữ toàn ứng dụng vì nhiều từ đang thiên về dân kỹ thuật/kế toán.
- Tạo branch `phase-36-owner-friendly-language` từ Phase35.
- Cải thiện câu trả lời tài chính của Trợ lý: diễn đạt tiền còn lại sau khi trừ hoàn tiền và chi phí; không gọi là lợi nhuận cuối cùng khi thiếu tiền vật tư, tiền công hoặc hoa hồng.
- Thêm helper chuyển thuật ngữ, cập nhật hướng dẫn AI cố vấn, tiêu đề/nhãn trên Assistant, Dashboard, Reports và RevenueChart.
- Unit tests mới cho câu trả lời lợi nhuận và thay thuật ngữ. Cần CI và Owner kiểm tra runtime.
- Không thay công thức tài chính, dữ liệu, schema, auth, tenant scope, quyền Owner hoặc thao tác ghi. Không merge/deploy.
- Tài liệu chi tiết: `docs/sessions/PHASE-36-OWNER-FRIENDLY-LANGUAGE.md`.


## Phiên 2026-11-26 – Phase 37: Hướng dẫn & giới thiệu
- Owner yêu cầu thêm mục hướng dẫn sử dụng app đầy đủ, dễ hiểu từ thao tác nhỏ đến các tính năng chính, đồng thời tích hợp nội dung vào bot để hỏi đáp.
- Tạo branch `phase-37-owner-guide-and-assistant-knowledge` từ Phase36.
- Thêm mục menu và trang hướng dẫn tìm kiếm/thu gọn; 13 chủ đề bao gồm đăng nhập/bắt đầu, lịch hẹn, khách, quy trình, nhân viên, dịch vụ, kho, thu ngân, báo cáo, trợ lý, thiết bị, backup, cài đặt/dữ liệu mẫu.
- Trợ lý định tuyến câu hỏi hướng dẫn về nội dung cục bộ trước khi đọc dữ liệu kinh doanh; các câu hỏi hướng dẫn không cần gọi Gemini.
- Nêu rõ giới hạn đồng bộ nhiều thiết bị và các lưu ý dữ liệu mẫu/tài chính. Thêm tests, cập nhật roadmap/session.
- CI và Owner acceptance pending. Không đổi schema, dữ liệu, auth, tenant scope, quyền hoặc công thức; không merge/deploy.
- Chi tiết: `docs/sessions/PHASE-37-OWNER-GUIDE-AND-ASSISTANT-KNOWLEDGE.md`.


## Phiên 2026-11-26 – Phase 38: Kiểm tra Gemini API và cải thiện trò chuyện
- Owner yêu cầu kiểm tra Trợ lý có thực sự kết nối Gemini API không, đồng thời làm câu trả lời thông minh và tự nhiên hơn khi dùng gói miễn phí.
- Rà soát branch Phase37: `assistant-gemini.ts` dùng Firebase AI Logic SDK (`firebase/ai`), `GoogleAIBackend`, model `gemini-3.8-flash`; `AssistantPage` gọi Gemini khi câu hỏi thuộc nhóm tư vấn/chưa nhận diện. Câu hỏi hướng dẫn, truy vấn nghiệp vụ và số liệu vẫn local-first.
- Phát hiện nhãn “đã kết nối” cũ chỉ dựa vào sự hiện diện Firebase config + App Check; chưa phải request live.
- Tạo branch `phase-38-gemini-live-check-and-natural-chat` từ Phase37. Thêm live probe token thấp, nút kiểm tra kết nối, phân biệt cấu hình/kết nối thật và thông báo lỗi quota/App Check/cấu hình. Prompt Gemini được chỉnh để trò chuyện tiếng Việt ấm áp, ít máy móc, ít gạch đầu dòng; giới hạn output giảm nhẹ.
- Cập nhật CI branch filters, ROADMAP và session note. Chưa merge/deploy.
- Owner runtime acceptance còn bắt buộc: chạy app và bấm **Kiểm tra kết nối**. CI chỉ xác minh code/build, không thể xác nhận Firebase project thực tế đã bật AI Logic/App Check.
- Tài liệu chính thức: Firebase AI Logic yêu cầu bật Gemini Developer API + Firebase AI Logic API và App Check; Free Tier quota phụ thuộc model/project, không có cam kết chung 1 triệu token/ngày.
- Chi tiết: `docs/sessions/PHASE-38-GEMINI-LIVE-CHECK-AND-NATURAL-CHAT.md`.

- Follow-up Phase38: Gemini nhận tối đa 3 câu hỏi người dùng gần nhất đã qua redaction (300 ký tự/câu, tối đa 900 ký tự) để xử lý hội thoại nối tiếp; không đưa các câu trả lời local trước đó lên cloud.


## Phiên 2026-11-26 – Phase 39: Chẩn đoán API key/env path Gemini
- Owner báo live probe Phase38 trả thông báo chung. Rà soát branch Phase38 xác nhận app lấy Firebase Web API key bằng `import.meta.env.VITE_FIREBASE_API_KEY` trong `src/lib/firebase.ts`; `GoogleAIBackend` Firebase AI Logic dùng Firebase app config, không có `GEMINI_API_KEY` riêng trong frontend. reCAPTCHA lấy từ `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
- Vite đọc `.env.local` từ project root; `.gitignore` đã bỏ qua `.env`, `.env.*` và `*.local`. Sau khi thay env phải restart Vite. Các biến VITE_ được đưa vào bundle client; Firebase Web API key là config public, không phải Gemini secret. Không gửi key qua chat.
- Tạo branch `phase-39-gemini-env-path-diagnostics` từ Phase38. Thêm diagnostics không lộ key (projectId, key loaded flag, site key loaded flag, App Check state, model) và hiển thị SDK error code/message đã redact key-like values. Cập nhật typing App Check env và CI filters.
- Chưa chạy CI thành công/ chưa có kết quả; chờ Owner kiểm tra giá trị local bằng lệnh bảo mật, chạy app và cung cấp mã lỗi chi tiết. Không merge/deploy.


## Phiên 2026-11-26 – Phase 40: Gemini hội thoại, định tuyến local/hybrid và giới hạn quyền
- Tạo branch `phase-40-gemini-role-aware-assistant-routing` từ Phase 39; không sửa main, không merge và không deploy.
- Tách định tuyến câu hỏi bằng `assistant-routing.ts`: chat/sáng tác thông thường đi thẳng Gemini, câu hỏi nghiệp vụ chính xác dùng bộ máy local, yêu cầu tư vấn kết hợp số liệu nghiệp vụ đã tổng hợp với Gemini.
- Luồng chat thông thường không gọi `answerOwnerQuestion`, không mở IndexedDB salon, không đọc danh sách khách hàng/nhân viên và không nạp trí nhớ salon. Email/số điện thoại dạng rõ ràng được che trước khi gửi Gemini.
- Luồng hybrid vẫn tính toán tại thiết bị theo salonId. Gemini chỉ nhận câu hỏi đã redaction, số liệu tổng hợp safeContext và thống kê thói quen; không nhận hồ sơ khách hàng/nhân viên, không được quyền ghi hoặc thực hiện thao tác.
- Bổ sung `askGeminiConversation` với prompt hội thoại tự nhiên và role context OWNER lấy từ màn hình Owner đã được AuthGate bảo vệ. Gemini không được quyền tự xác định membership hoặc cấp quyền.
- Thêm timeout: live probe 15 giây, tư vấn 25 giây, hội thoại 30 giây; hiển thị lỗi chi tiết đã lọc và kết thúc trạng thái chờ thay vì treo vô hạn.
- Sửa nhãn cấu hình: hiển thị rõ Firebase Web API key, không gọi nhầm đó là Gemini API key; nhãn Gemini chỉ nói có cấu hình cơ bản, không khẳng định kết nối live trước khi probe thành công.
- Bổ sung unit tests cho route chat/local/hybrid, và che email/số điện thoại + giới hạn độ dài prompt.
- Ranh giới vai trò: AuthGate hiện chỉ chấp nhận membership active + role owner + salonId hợp lệ; Employee App/Auth/Membership chưa triển khai. Không cho nhân viên vào Owner Assistant và không giả định hồ sơ nhân viên trong bảng nhân sự là tài khoản đăng nhập. Employee AI sẽ cần membership riêng, quyền dữ liệu riêng và context vai trò được xác minh trước khi bật.
- Cần CI xác nhận typecheck/lint/tests/build, review diff, rồi Owner chạy Termux/Android: hỏi làm thơ, chat tự nhiên, tra cứu doanh thu/kho/nhân viên/khách, tư vấn kết hợp dữ liệu, kiểm tra Gemini timeout và App Check.
- Trạng thái: IMPLEMENTED ON BRANCH; chưa PASS runtime, chưa merge, chưa deploy. Không thay Firestore Rules, Firebase config, model ID hoặc billing.

- Bổ sung kiểm thử chẩn đoán Gemini để xác nhận token/credential trong lỗi SDK được che; điều chỉnh nhãn tin nhắn AI để phân biệt câu trả lời Gemini tổng quát với trợ lý local. CI cần chạy lại trên HEAD mới nhất sau các chỉnh sửa cuối.

- GitHub Actions CI run #542 trên Phase 40 HEAD đã PASS: Typecheck, Lint, Unit tests và Production build/PWA. Chỉ xác nhận chất lượng code/build; chưa chứng minh Gemini live/App Check hoạt động trên Firebase project hoặc Android runtime.

- Tinh chỉnh hội thoại trực tiếp: Gemini nhận tối đa 3 câu hỏi người dùng gần nhất (300 ký tự/câu, tối đa 900 ký tự) sau khi che email/số điện thoại; context chỉ lấy từ state chat hiện có, không đọc IndexedDB hay trí nhớ salon.

- Sau khi bổ sung ngữ cảnh hội thoại an toàn (tối đa 3 câu hỏi, che email/số điện thoại, không đọc IndexedDB), CI run #553 trên HEAD Phase 40 PASS đầy đủ Typecheck, Lint, Unit tests và Production build/PWA.


## Phiên 2026-11-28 – Phase 42: Chuyển Gemini sang Google AI Studio cho Termux
- Tạo nhánh `phase-42-gemini-aistudio-termux-env` từ `phase-41-app-check-local-debug-provider`; không sửa main, không merge và không deploy.
- Thay luồng Firebase AI Logic trong `src/app/assistant-gemini.ts` bằng local HTTP proxy `/__local-api/gemini`.
- Thêm Vite dev middleware đọc `GEMINI_API_KEY` từ `.env.local` phía Node server; không dùng `VITE_GEMINI_API_KEY`, không đưa khóa vào browser bundle.
- Giữ Firebase Auth, Firestore, Dexie, bộ nhớ, local assistant, routing, role guard và prompt redaction.
- Giữ nguyên App Check Firebase hiện có để không vô tình thay đổi bảo vệ Firebase Auth/Firestore; Gemini không đi qua Firebase AI Logic/App Check.
- Local proxy giới hạn Origin localhost, body, prompt, timeout và request rate; chỉ hoạt động trong Vite dev server Termux, không phải backend production.
- Cập nhật UI trạng thái AI Studio, `.env.example`, ROADMAP P21 và thêm unit tests.
- Chưa xác nhận CI, chưa chạy live Gemini API trên thiết bị. Cần Owner thêm `GEMINI_API_KEY` vào `.env.local`, restart Vite, chạy kiểm tra kết nối và regression trên Android/Termux.
- Không ghi PASS runtime, không merge/deploy trước khi có bằng chứng kiểm thử.


## Phase 42 – Audit lỗi Gemini EMPTY_RESPONSE – 2026-11-28
- Audit trực tiếp nhánh `phase-42-gemini-aistudio-termux-env` phát hiện nút kiểm tra kết nối gửi `maxOutputTokens=24` tới Gemini 3.8 Flash. Ngân sách quá thấp vì token suy luận cũng nằm trong giới hạn đầu ra; có thể trả HTTP 200 nhưng không có text hiển thị.
- Sửa smoke test lên 1.024 token, đặt thinking level LOW tại proxy, tăng timeout kiểm tra; chat/tư vấn dùng 2.048 token.
- Proxy trả mã chẩn đoán phân biệt prompt bị chặn, MAX_TOKENS, API key bị từ chối, access denied, model not found, quota và service unavailable; không tiết lộ nguyên văn payload upstream.
- Sửa UI bỏ các hướng dẫn lỗi Firebase AI Logic/App Check và `VITE_FIREBASE_API_KEY` còn sót; chẩn đoán theo Gemini Developer API.
- Sửa lỗi UI đọc `expectedProject` không tồn tại trong cấu hình; hiện lấy project ID thật từ `firebaseEnvDiagnostics` và giải thích cảnh báo Firebase project không tự động là nguyên nhân lỗi Gemini AI Studio.
- Bổ sung unit tests cho token budget và Firebase project diagnostic. Chưa xác nhận CI hoặc live Gemini trên Termux; chưa merge/deploy. Firebase Auth/Firestore/App Check và Dexie giữ nguyên.


## Phase 42 – Xử lý Gemini SERVICE_UNAVAILABLE – 2026-11-28
- Người dùng báo kiểm tra kết nối trả `GEMINI_SERVICE_UNAVAILABLE`.
- Rà soát `vite.config.ts`: mã này chỉ được gán khi Google upstream trả HTTP 503. Nhánh lỗi khóa thiếu/sai, model 404 và quota 429 được phân loại riêng. Do đó 503 hiện tại không chứng minh .env.local sai; nhiều khả năng là lỗi khả dụng/quá tải tạm thời phía dịch vụ Gemini.
- Theo hướng dẫn Gemini API của Google, 503 là dịch vụ tạm thời quá tải/không khả dụng; khuyến nghị retry với exponential backoff.
- Đã cập nhật proxy: retry tối đa 2 lần bổ sung cho HTTP 500/502/503/504, delay exponential + jitter; không retry lỗi xác thực, request 400 hoặc quota 429. Giữ HTTP 503 khi trả về client để chẩn đoán chính xác hơn.
- Tăng timeout client lên 60 giây để đủ thời gian cho retry có giới hạn.
- Commit: `46a8a9bd3b58eede80a84ebed1e547073ea90911`, `07a781b27eddf77b5e4ff6094893855ec69d75a4`.
- Chưa xác nhận CI và chưa có live smoke test trên Termux; chưa merge/deploy. Firebase Auth, Firestore, App Check và Dexie không thay đổi.


## Phiên 2026-11-28 – Phase 43: Chuyển trợ lý sang Gemini 3.5 Flash-Lite
- Tạo branch `phase-43-gemini-model-flash-lite` từ `phase-42-fix-vitest-appcheck-dom-isolation`.
- Kết quả Termux trực tiếp: `gemini-3.8-flash` trả HTTP 503 UNAVAILABLE; `gemini-3.5-flash-lite` trả HTTP 200, nội dung tiếng Việt và modelVersion chính xác.
- Đổi model thống nhất trong `vite.config.ts` (proxy server-side) và `src/app/assistant-gemini.ts` (trạng thái UI).
- Cập nhật `tests/assistant-gemini.test.ts` kiểm tra model mới; cập nhật ROADMAP và tạo `PHASE-43-GEMINI-FLASH-LITE.md`.
- Giữ nguyên API key server-only trong `.env.local`, Firebase Auth, Firestore, App Check, Dexie, prompt và quyền Owner.
- Bằng chứng direct API live test PASS do Owner chạy trên Termux. Proxy smoke test, typecheck/lint/test/build trên HEAD Phase 43, CI và kiểm tra sâu trong app còn pending.
- Không merge/deploy; không đánh dấu P21 PASS cho đến khi các bước kiểm chứng còn lại hoàn tất.


## Phiên 2026-11-28 – Phase 44: Hợp nhất ENA điều hành salon
- Tạo branch `phase-44-ena-unified-operations-assistant` từ `phase-43-gemini-model-flash-lite`; không sửa main, không merge/deploy.
- Rà soát AuthGate: hiện ứng dụng chỉ có luồng đăng nhập Google và Owner Membership active; `OwnerContext` cung cấp `salonId`, `actorId`, `deviceId`. Employee App/Auth/Membership chưa có. Vì vậy ENA chỉ hoạt động trong Owner workspace; nhân viên không được mở trợ lý cho đến khi có danh tính đăng nhập, membership và quyền dữ liệu riêng được xác minh.
- Hợp nhất danh tính hiển thị thành ENA, bỏ nhãn tin nhắn phân biệt local/Gemini. Gemini vẫn là mô hình xử lý ngôn ngữ; app/repository mới là nơi đọc/ghi dữ liệu.
- Gemini nhận kết quả nghiệp vụ đã tính cho nhóm báo cáo an toàn: tài chính, tồn kho, lịch hẹn, dịch vụ, tổng quan. Không gửi hồ sơ khách hàng/nhân viên có định danh trong các luồng báo cáo. Các yêu cầu tra cứu hồ sơ cá nhân vẫn được xử lý local.
- Thêm guard kiểm tra Firebase UID hiện tại khớp `actorId` của OwnerContext và ngữ cảnh salon/thiết bị đầy đủ.
- Thêm tạo khách hàng có kiểm tra trùng, xem trước và xác nhận; cập nhật số điện thoại theo tên chính xác, chỉ sửa khi tìm được đúng một hồ sơ; dùng repository `saveCustomer` có Zod validation và audit log.
- Thêm ngừng kinh doanh sản phẩm theo SKU và xác nhận; đánh dấu inactive, không xóa sản phẩm/lịch sử tồn kho. Giữ nguyên tạo sản phẩm + tồn đầu kỳ, cập nhật giá bán và lưu trữ khách hàng đã có.
- Gemini được ràng buộc chỉ diễn giải dữ liệu do ứng dụng cung cấp; không có quyền truy cập DB và không được tự ghi/sửa/xóa.
- Thêm tests `assistant-ena-policy.test.ts`, `assistant-ena-actions.test.ts`; cập nhật CI branch filters và ROADMAP.
- Giới hạn production: `GEMINI_API_KEY` vẫn server-only trong `.env.local`; proxy hiện chỉ chạy Vite development trên Termux, chưa phải backend production. Không deploy production với proxy dev.
- Trạng thái: IMPLEMENTED ON BRANCH; chưa xác nhận typecheck/lint/test/build/CI hoặc kiểm thử app trên Termux/Android; chưa merge/deploy. Employee ENA bị khóa có chủ đích cho đến khi có auth + membership + permission context.
