# ROADMAP – Salon TÓC QUYỀN
Phạm vi giai đoạn 1: Owner App. Employee App là giai đoạn 2, không trộn giao diện nhân viên trước khi Owner nghiệm thu.
| ID | Hạng mục | Trạng thái |
|---|---|---|
| P01 | Repository, cấu trúc, UI shell | IN PROGRESS – chờ nghiệm thu runtime |
| P02 | Firebase Auth, Owner membership, Rules | IN PROGRESS |
| P03 | Dexie schema, migration, validation | IN PROGRESS |
| P04 | Khách hàng và lịch hẹn | IN PROGRESS |
| P05 | Dịch vụ, công thức, workflow event log | IN PROGRESS |
| P06 | Nhân viên, ca làm, quyền, hoa hồng | IN PROGRESS |
| P07 | Kho, lô, vật tư tiêu hao | IN PROGRESS |
| P08 | POS, hóa đơn, thanh toán, thuế | IN PROGRESS |
| P09 | Dashboard và báo cáo | IN PROGRESS |
| P10 | Thiết bị, E2E encryption, conflict | IN PROGRESS – protocol có, P2P transport còn thiếu |
| P11 | Backup/restore mã hóa | IN PROGRESS – cần smoke test IndexedDB/Android |
| P12 | Gemini Cloud Function (legacy path, không còn được Owner Assistant gọi) | CODE RETAINED – không cần deploy để dùng trợ lý mới |
| P13 | PWA, bảo mật và nghiệm thu | IN PROGRESS – chờ smoke test thiết bị |
| P14 | Dữ liệu mẫu tenant-scoped | IMPLEMENTED – chờ smoke test dữ liệu thật |
| P15 | Dashboard số liệu Dexie | IMPLEMENTED – chờ đối chiếu runtime |
| P16 | Quản lý nhân sự và kho | IMPLEMENTED – chờ smoke test |
| P17 | Ổn định và nghiệm thu Owner App | IN PROGRESS – chờ acceptance Android |
| P18 | Robot trợ lý và dữ liệu mẫu trên Owner App | IMPLEMENTED ON BRANCH – chờ CI/acceptance |
| P19 | Trợ lý nội bộ: hỏi đáp số liệu salon bằng tiếng Việt | CI PASS – chờ Termux/Android smoke test |
| P20 | Bộ nhớ học thói quen Owner, tenant-scoped, có quyền xóa | CODE IMPLEMENTED – chờ kiểm thử lưu trữ trên Android |
| P21 | Gemini cố vấn qua Firebase AI Logic, Spark-compatible | CI PASS – chờ bật AI Logic/App Check và smoke test live |
| P22 | Salon Brain Core: trí nhớ dài hạn Owner lưu Dexie, ghi nhớ có chủ đích, truy xuất và quản lý trí nhớ | IMPLEMENTED ON BRANCH – chờ CI/Termux; local-only, chưa P2P |
| P23 | Hiểu hội thoại, ngữ cảnh cá nhân và lập kế hoạch ngày/tuần | NOT STARTED |
| P24 | Core Governance: quyền hạn, xác nhận hành động, audit và chống prompt injection | NOT STARTED |
| P25 | Ghép đôi thiết bị Owner, danh tính thiết bị và xác thực peer | NOT STARTED |
| P26 | P2P transport WebRTC, trao đổi change log mã hóa đầu cuối | NOT STARTED – không dùng cloud storage/signaling lưu dữ liệu |
| P27 | Đồng bộ trí nhớ + dữ liệu Dexie, conflict resolution và offline recovery | NOT STARTED |
| P28 | Gemini cố vấn tùy chọn, chỉ nhận dữ liệu được Owner cho phép | NOT STARTED – không có quyền ghi/điều khiển |
| P29 | Membership AI theo vai trò và hỗ trợ chủ động | NOT STARTED; Employee AI chỉ sau Employee Auth/Membership |
| E01 | Employee App độc lập theo vai trò | GIAI ĐOẠN 2 – CHƯA TRIỂN KHAI |
## Nguyên tắc kiến trúc P2P-only đã chốt – 2026-11-23
- Owner chọn phương án A: chỉ P2P, không lưu dữ liệu nghiệp vụ, trí nhớ hoặc kiến thức AI trên Firebase/Google Drive/cloud storage.
- Mỗi thiết bị giữ bản dữ liệu cục bộ; chỉ trao đổi trực tiếp với peer đã được Owner ghép đôi và phê duyệt. Mọi payload P2P phải mã hóa đầu cuối; không coi signaling/identity service là nơi lưu dữ liệu.
- Thiết bị offline giữ dữ liệu local và đồng bộ khi có kết nối trực tiếp trở lại. Không hứa đồng bộ khi peer không online/không reachable.
- Nếu tất cả thiết bị mất/hỏng thì không có cloud recovery. Chủ tiệm cần tự xuất và giữ file backup mã hóa offline trên USB/ổ cứng; tuyệt đối không tự upload.
- Firebase chỉ làm Auth/Membership/kiểm soát hệ thống, không làm kho dữ liệu salon hoặc trí nhớ AI.

## Definition of Done
Nghiệp vụ thật; validation; error handling; tenant isolation; audit trail; unit/integration/regression tests; typecheck, lint, build; mobile/desktop verification; tài liệu và session log. Chỉ PASS khi có bằng chứng.
## P04 + P05 – 2026-11-18
- Dexie schema version 2 bổ sung workflowEvents và giữ migration version 1.
- Thêm local-first repositories cho khách hàng, lịch hẹn, dịch vụ và nhật ký sự kiện quy trình.
- Các thao tác yêu cầu ActorContext, giới hạn salonId và ghi audit trong cùng transaction.
- Lịch hẹn có tiền cọc, snapshot khách và state transition được kiểm soát.
- Công thức tóc lưu dạng snapshot append-only cùng workflow event.
- Schema tests được mở rộng; CI và IndexedDB/browser smoke test đang chờ.
- Chưa có UI CRUD nghiệp vụ, chưa tích hợp nhân viên/kho/cloud sync.

## Cập nhật triển khai UI P04 + P05 – 2026-11-19
- Đã bổ sung OwnerContext chỉ được tạo sau khi AuthGate xác minh Google user có membership active, role owner và salonId hợp lệ.
- Đã kết nối CRUD khách hàng: tạo, đọc, tìm kiếm, sửa và lưu trữ; mọi thao tác đi qua repository có salon scope và audit.
- Đã kết nối CRUD dịch vụ: tạo, đọc, sửa; validate thời lượng và giá VND qua schema.
- Đã bổ sung giao diện tạo lịch hẹn: chọn khách hàng, dịch vụ, thời gian, tiền cọc; trạng thái có luồng chuyển tiếp giới hạn.
- Đã bổ sung giao diện nhật ký quy trình và lưu snapshot công thức tóc theo lịch hẹn.
- UI chưa được nghiệm thu trên trình duyệt/Termux thật; IndexedDB integration test, kiểm tra dữ liệu nhiều salon, quyền Firestore và backup còn chờ.
- P04/P05 vẫn IN PROGRESS; CI của commit mới nhất đang chạy. Không đánh dấu PASS trước khi có kiểm thử runtime và regression.

- Bổ sung kiểm thử chuẩn hóa tên tiếng Việt và số điện thoại; đã sửa regex để loại bỏ dấu phân cách số điện thoại và dấu thanh Unicode đúng cách.

## P06 + P07 – 2026-11-19
- Dexie schema version 3 bổ sung employees, workShifts, commissionPolicies, products, suppliers, purchaseOrders, inventoryLots và stockMovements; giữ migration v1/v2.
- Thêm schema validation cho nhân viên, ca làm, chính sách hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- Repository P06 có hồ sơ nhân viên, xếp ca (chặn trùng ca cùng nhân viên) và chính sách hoa hồng theo nhân viên/dịch vụ.
- Repository P07 có danh mục sản phẩm, nhà cung cấp, tạo đơn mua, nhận hàng từng phần, tạo lô và stock movement trong transaction.
- UI Owner đã nối quản lý nhân viên, ca, hoa hồng, sản phẩm, nhà cung cấp, đơn mua và nhận hàng.
- P06/P07 vẫn IN PROGRESS: chưa có integration test IndexedDB, kiểm thử thực tế trên thiết bị, điều chỉnh tồn kho/tiêu hao và kiểm tra hạn dùng tự động.

## P08 + P09 – 2026-11-19
- Dexie schema v4 bổ sung invoices, payments, refunds, cashSessions, expenses và taxPolicies.
- Repository phát hành hóa đơn với snapshot dòng hàng, chính sách thuế hiệu lực và kiểm tra khách/dịch vụ/sản phẩm.
- Bán sản phẩm trừ tồn FEFO từ inventory lots; invoice + lot update + stock movement + audit nằm trong một transaction, thiếu tồn thì rollback.
- Payment hỗ trợ cash/bank transfer/card/other, partial payment và kiểm tra số dư hóa đơn.
- Refund hỗ trợ hoàn một phần/toàn phần; hoàn tiền mặt yêu cầu ca thu ngân đang mở.
- Cash session mở/đóng, tính expected cash từ float + thu tiền mặt - hoàn tiền mặt - chi tiền mặt; ghi chi phí.
- Reports tổng hợp số hóa đơn, doanh số phát hành, tiền đã thu, hoàn tiền, chi phí và thu ròng theo khoảng thời gian.
- Owner UI đã kết nối thu ngân, chính sách thuế, hóa đơn, thanh toán, hoàn tiền, chi phí, đóng ca và báo cáo.
- CI trên commit UI hiện tại: Typecheck, Lint, Unit tests và Production build PASS. P08/P09 vẫn IN PROGRESS vì chưa có runtime/browser smoke test và đối soát nghiệp vụ thực tế.

## P10 + P11 – 2026-11-19
- Dexie schema v5 thêm devices, changeLogs, syncConflicts, syncCursors, backupRecords.
- Thêm đăng ký/duyệt/thu hồi thiết bị, hàng đợi change log chỉ nhận encryptedPayload, cursor và conflict records.
- Thêm protocol đóng gói/mở gói đồng bộ AES-GCM với PBKDF2 và kiểm tra salonId/peerDeviceId. Chưa có kênh WebRTC/signaling hoặc truyền dữ liệu thực tế.
- Thêm backup export AES-GCM 256, PBKDF2 SHA-256 310.000 vòng, checksum SHA-256; restore có merge/replace, xác minh salonId và chặn bản ghi khác tenant.
- Owner UI có màn hình thiết bị/xung đột và backup/restore mã hóa.
- Unit tests xác minh mã hóa, sai mật khẩu, context và peer/salon isolation.
- CI trên commit P10/P11: Typecheck, Lint, Unit tests và Production build PASS. P10/P11 vẫn IN PROGRESS do chưa có transport P2P và kiểm thử backup IndexedDB trên thiết bị thật.

## P12 + P13 – 2026-11-19
- Cloud Function salonAssistant dùng Gemini 3.8 Flash server-side, secret GEMINI_API_KEY từ Firebase Secret Manager; không đưa key xuống Vite/browser.
- Function kiểm tra Firebase Auth, App Check bắt buộc, membership active/owner, giới hạn 10 yêu cầu/phút theo UID, giới hạn kích thước prompt/context và không lưu prompt.
- Owner UI trợ lý AI chỉ gửi câu hỏi/ngữ cảnh do người dùng tự nhập; không tự truy cập hồ sơ khách hàng, hóa đơn hoặc kho.
- Firebase App Check Web dùng reCAPTCHA Enterprise; khóa chức năng AI khi site key chưa được cấu hình.
- Firebase Hosting cấu hình SPA rewrite và security headers; Firebase Functions runtime Node 22; Firestore Rules giữ deny-by-default.
- CI thêm cài đặt/build Cloud Functions.
- P12/P13 vẫn IN PROGRESS cho đến khi user cấu hình Firebase/App Check/Gemini Secret, deploy và chạy smoke test thực tế.


## Rà soát P12 + P13 – 2026-11-19
- Xác nhận model `gemini-3.8-flash` có trong danh sách model Gemini API hiện hành của Google; model ID được giữ nguyên.
- Rà soát điều hướng Owner App và loại bỏ nhánh điều kiện `/assistant` bị lặp.
- CI mới nhất trên nhánh P12/P13 đã PASS gồm frontend và Cloud Functions build; chưa deploy Firebase, chưa test App Check/Gemini thực tế.


## P14 – Owner App polish & demo data – 2026-11-22
- Tạo bộ dữ liệu mẫu có ID `demo_<salonId>_...`, tenant-scoped, gồm 10 nhân viên, 10 khách hàng, 6 dịch vụ, 8 lịch hẹn, ca làm, hoa hồng, sản phẩm và nhà cung cấp.
- Trang Cài đặt cho phép nạp dữ liệu mẫu một lần, xem số lượng và xóa riêng bản ghi demo; không xóa dữ liệu thật.
- P14 vẫn IN PROGRESS cho tới khi CI và smoke test Android/IndexedDB xác nhận PASS.


## P14 – P16: Hoàn thiện Owner App – 2026-11-22
- P14: bộ dữ liệu demo tenant-scoped gồm 10 nhân viên, 10 khách, 6 dịch vụ, 8 lịch, 10 ca, 10 hoa hồng, 6 sản phẩm, 2 nhà cung cấp, 2 PO đã nhận, 6 lô tồn và 6 stock movement; ID có tiền tố demo_<salonId>_. Nạp một lần, chống tạo trùng, xóa chỉ record demo thuộc salon hiện tại.
- P15: Dashboard tổng hợp lịch hẹn hôm nay, khách hàng, nhân viên active, số mặt hàng và tồn dưới ngưỡng, thu ròng tháng hiện tại từ repositories Dexie.
- P16: danh sách nhân viên có thao tác chỉnh sửa và chuyển active/inactive; lịch ca tiếp tục chỉ cho chọn nhân viên active.
- Kho hiển thị cảnh báo mặt hàng có tồn khả dụng nhỏ hơn hoặc bằng tồn tối thiểu.
- Trạng thái P14–P16: IMPLEMENTED ON BRANCH, chưa PASS cho tới khi CI toàn bộ và smoke test Android/IndexedDB đạt.


## P17 – Nghiệm thu và ổn định Owner App – 2026-11-22
- Tạo nhánh phase-17-owner-app-acceptance từ head P14–P16 25be9737686600b68e1c0df58f6b430744086dfa; không thay đổi main và không merge PR nền tảng.
- Rà soát các luồng đăng nhập Owner, điều hướng, dữ liệu Dexie, lịch hẹn/quy trình, nhân sự/kho, POS/báo cáo và công cụ dữ liệu mẫu.
- Sửa màn hình chờ quyền Owner: bổ sung thao tác thử xác minh membership lại khi Firestore tạm thời lỗi hoặc membership vừa được cấp; giữ nguyên nguyên tắc fail-closed, không cho trình duyệt tự cấp quyền.
- Còn bắt buộc: chạy typecheck/lint/test/build trên Termux; smoke test Android/IndexedDB; kiểm tra nạp/xóa dữ liệu mẫu không ảnh hưởng dữ liệu thật; kiểm tra luồng hóa đơn/thanh toán/hoàn tiền/đóng ca; backup và restore trên thiết bị.
- P17 chưa PASS, không được merge PR hoặc tuyên bố sẵn sàng dữ liệu thật trước khi có kết quả kiểm tra thực tế.


## P18 – Trợ lý AI đồng hành và truy cập theo Membership – 2026-11-22
- Bổ sung robot trợ lý nổi toàn Owner App, có hoạt ảnh và mở nhanh trang AI.
- Thêm lối tắt Dữ liệu mẫu ở header trên mọi màn hình; tiếp tục dùng chức năng nạp/xóa tenant-scoped đã có trong Settings.
- Trợ lý tự tạo snapshot phân tích từ IndexedDB hiện tại: lịch, khách, nhân sự, dịch vụ, kho, hóa đơn, thu/hoàn và chi phí; chỉ gửi số liệu tổng hợp, không gửi PII.
- Cloud Function vẫn xác minh Firebase Auth + Owner Membership + App Check; quota chống lạm dụng tăng lên 30/phút, context tối đa 12.000 ký tự.
- AI chỉ phân tích/đề xuất, chưa có quyền ghi dữ liệu. Employee AI chưa bật vì Employee App và employee Membership chưa triển khai.
- Ma trận quyền hiện tại/tương lai được ghi tại docs/AI-PHAN-QUYEN.md.
- P18 IN PROGRESS cho đến khi CI, kiểm thử Android, kiểm tra dữ liệu mẫu và cấu hình/deploy Gemini + App Check hoàn tất.


## P19–P21 – Trợ lý học hỏi và Gemini cố vấn – 2026-11-23
- P19: thay giao diện hỏi AI phụ thuộc Cloud Functions bằng chat tiếng Việt local-first; tính doanh thu hóa đơn, tiền đã thu, hoàn tiền, chi phí, thu ròng, lịch hẹn, top khách, dịch vụ phổ biến và cảnh báo tồn theo salonId và Owner UID.
- Phân biệt doanh thu hóa đơn với tiền thực thu và thu ròng; loại hóa đơn void. Múi giờ báo cáo Asia/Ho_Chi_Minh. Không xếp hạng doanh thu/hiệu suất nhân viên khi lịch hẹn/hóa đơn chưa có employeeId liên kết.
- P20: ghi nhớ thói quen bằng bộ đếm chủ đề/khoảng thời gian trong localStorage theo salonId và Owner UID; không lưu câu hỏi nguyên văn, PII hay dữ liệu kinh doanh; có thao tác xóa bộ nhớ.
- P21: thêm Gemini 3.8 Flash qua Firebase AI Logic SDK, chỉ gọi cho câu hỏi tư vấn/chưa nhận diện; gửi số liệu tổng hợp đã loại bỏ định danh. Không dùng Cloud Functions hoặc API key trong frontend.
- Gemini Free Tier có giới hạn và điều khoản dữ liệu riêng; cần chủ salon cân nhắc trước khi bật. Local assistant vẫn hoạt động khi Gemini chưa bật/hết hạn mức/mất mạng.
- Firebase AI Logic/App Check chưa được kích hoạt live trên project; P21 chưa PASS.
- Các vai trò Manager/Stylist/Assistant/Cashier chưa được cấp AI vì hiện tại chỉ có Owner Membership được xác minh; không dùng trường role cục bộ làm bằng chứng quyền.
- Tất cả P19–P21 chờ CI, kiểm thử trên Termux/Android và xác minh dữ liệu mẫu/thật trước khi nghiệm thu.


## P27 – Bàn giao Owner, onboarding Firestore-only – 2026-11-24
- Tách tài khoản phát triển khỏi tài khoản chủ tiệm; người nhận bàn giao đăng nhập Google cá nhân và tạo tenant riêng.
- Thay callable `createOwnerSalon` bằng một Firestore writeBatch tạo salon + membership cùng lúc.
- Firestore Rules chỉ cho Google UID chưa có membership tạo đúng membership của chính UID đó, kèm salon có cùng ownerUid/salonId trong trạng thái sau batch; cấm client ghi riêng membership, đổi role, cập nhật hoặc xóa.
- Gỡ Cloud Functions SDK khỏi frontend, cấu hình Functions khỏi firebase.json, bỏ Functions khỏi CI và loại bỏ mã nguồn Functions không còn được sử dụng.
- Không thay đổi bot local, bộ nhớ AI, Gemini Firebase AI Logic, Dexie schema, các module nghiệp vụ hoặc dữ liệu hiện tại.
- Cần chạy CI + Termux regression; deploy riêng Firestore Rules lên đúng project `salonquyen-f21fa`; kiểm tra hai Google account độc lập và tenant isolation trước khi merge.
- Trạng thái: IMPLEMENTED ON BRANCH; chưa deploy Rules, chưa runtime PASS, chưa merge.


## Kiểm tra bàn giao Owner – tenant isolation regression – 2026-11-24
- Tạo nhánh kiểm thử độc lập từ P27, không sửa membership hoặc dữ liệu Firebase hiện hữu.
- Xác nhận kiến trúc hiện tại giữ dữ liệu nghiệp vụ trong một IndexedDB local-first, nhưng mọi repository và truy vấn trợ lý phải lọc theo salonId; trí nhớ dài hạn phải lọc đồng thời salonId + ownerId.
- Bổ sung regression tests cho: chỉ liệt kê khách thuộc salon hiện tại; từ chối sửa hồ sơ thuộc salon cũ; mọi truy vấn dữ liệu của trợ lý dùng salonId đang xác thực; trí nhớ dài hạn giới hạn theo salonId + ownerId; không cho Owner mới lưu trữ trí nhớ của Owner cũ.
- Đây là lớp bảo vệ logic ứng dụng trên cùng thiết bị, không phải mã hóa dữ liệu IndexedDB theo từng tài khoản. Dữ liệu local cũ được giữ nguyên và không tự động chuyển sang tenant mới.
- Chờ CI và Termux regression; hai tài khoản Firebase vẫn cần smoke test riêng trước khi bàn giao.


## Phase 29 – Assistant & configurable analytics – 2026-11-24
- Branch: `phase-29-assistant-natural-language-and-configurable-analytics` (base P28 tenant isolation).
- Implemented first code wave: Vietnamese owner greeting; local staff profile lookup by exact name/phone; employee tenure and completed-shift summary; customer appointment frequency and invoice spend/product quantity rankings; responsive collected-vs-expense chart.
- Tests added for natural query phrasing and chart bucket aggregation.
- Remaining: employee attribution on invoice/service lines, safe confirmed write/archive actions from chat, customer groups/custom fields CRUD, product category management, and Android runtime acceptance.
- Status: IN PROGRESS; do not mark PASS or merge until CI + Termux + Android smoke tests pass.


## P30 – Bộ dữ liệu mô phỏng kinh doanh 5 tháng – 2026-11-25
- Thay bộ demo P14 đơn giản bằng dataset rolling 5 tháng có khách giả lập, nhân viên/ca, lịch hẹn, dịch vụ, POS invoices/payments/refunds, sản phẩm, PO/lot/stock movement, cash sessions và expenses/COGS.
- Cài đặt dùng thao tác tạo/thay mới bộ mô phỏng và xóa bộ mô phỏng; không còn UI nạp/xóa sample cũ.
- Dataset có ID demo tenant-scoped; giao dịch thật tham chiếu record demo sẽ khóa thay/xóa để giữ lịch sử.
- Có test cho khoảng 5 tháng và qua năm. Session note: `docs/sessions/P30-FIVE-MONTH-DEMO-DATA.md`.
- CI run 45512975364: Typecheck PASS, ESLint PASS, 53/53 tests PASS, Production build/PWA PASS.
- Trạng thái: CI PASS; chờ Owner Android/Termux acceptance. Chưa PASS tổng thể, chưa merge, chưa deploy.


## Hotfix P30 – IndexedDB missing object store
- Báo lỗi Owner: tạo dataset ném `NotFoundError` từ IndexedDB transaction do object store bị thiếu trên một số database schema v7 đã tồn tại.
- Sửa trên branch `fix-indexeddb-store-upgrade-p30`: nâng Dexie schema version 8, khai báo lại đầy đủ stores của v7 để migration tự tạo store thiếu, giữ nguyên records hiện có.
- Không hướng dẫn xóa IndexedDB/local storage. CI và Android acceptance đang chờ. Session: `docs/sessions/FIX-INDEXEDDB-OBJECT-STORE-P30.md`.

## P30 – sửa lỗi transaction seed (follow-up)
- Lần sửa dùng spread từng Table đã bị Owner phát hiện lỗi TypeScript: Dexie 4 typings không nhận 19 arguments; API chính thức cho phép array tables.
- Root cause runtime được xác định ở transaction scope: `assertNoRealReferences()` truy vấn `workflowEvents`, nhưng table này bị bỏ khỏi scope transaction.
- Sửa `seedDemoData` và `clearDemoData` dùng `salonDb.transaction('rw', [...demoTables, salonDb.workflowEvents], callback)`. `workflowEvents` chỉ được đưa vào scope để đọc kiểm tra liên kết, không bị xóa/ghi.
- Branch follow-up: `fix-demo-seed-dexie-transaction-tables`, base `fix-indexeddb-store-upgrade-p30`. Cần CI và Owner acceptance; chưa merge/deploy.


## Phase 31 – Định tuyến ý định và tra cứu đúng đối tượng – 2026-11-25
- Owner yêu cầu trợ lý ưu tiên hiểu ý định tìm kiếm/thống kê, không cần văn phong dài hoặc thuyết trình.
- Thêm tra cứu hồ sơ khách hàng theo tên đầy đủ, tên một phần hoặc số điện thoại; loại khách đã lưu trữ; nếu có nhiều kết quả thì liệt kê để Owner chọn, không tự chọn.
- Khi câu hỏi có tên khách cụ thể, trả hồ sơ và số liệu hóa đơn/lịch hẹn của đúng khách thay vì báo cáo tổng hợp hôm nay.
- Tách xếp hạng khách theo số lịch hẹn, tổng chi tiêu hóa đơn hoặc số lượng sản phẩm mua; chỉ trả chỉ số người dùng yêu cầu. Nếu chưa nêu tiêu chí hoặc có nhiều tiêu chí mâu thuẫn, hỏi lại.
- Tra cứu nhân viên không tìm thấy kết quả phải báo không tìm thấy, không chuyển thành báo cáo năng suất tổng quát; yêu cầu xếp hạng vẫn giữ luồng báo cáo.
- Thêm unit tests cho tên khách, tên một phần, điện thoại, kết quả mơ hồ, khách đã lưu trữ và phân biệt tra cứu với xếp hạng.
- Trạng thái: code + regression tests trên branch; chờ CI và Owner Termux/Android acceptance. Chưa merge/deploy.

## Phase 32 – Assistant product writes & salon invoice print – 2026-11-25
- Branch: `phase-32-assistant-write-actions-and-salon-invoice`, base `phase-31-assistant-intent-routing-search-p30` (P30 + Dexie hotfix + intent routing).
- Assistant: add product by name/SKU/sale price; require initial quantity and unit cost before writing opening stock; preview and require explicit confirmation; cancel is supported. Product SKU is checked for duplicates.
- Assistant: update product sale price by exact SKU with preview and confirmation. Tenant-scoped repository checks and audit events are retained.
- Product model: add `salePriceVnd`; legacy records remain readable (optional property) and fall back to prior demo custom-field price. POS automatically uses catalog sale price.
- Inventory: new atomic repository operation creates product + opening inventory lot + stock movement + audit events in one Dexie transaction.
- Invoice: professional salon-themed A4 print view with ornamental artwork, salon profile (name/address/phone/email/tax/bank), customer contact, invoice number/date/status, service/product lines, employee attribution, quantity/prices/discount/tax/totals, payments/refunds/balance, care notes and signature lines. Salon profile stored locally per salon.
- Demo: existing P30 demo invoices have customer, staff snapshot, lines and payment records for print testing; demo product records now have sale price.
- Legal boundary: print is an internal sales receipt; not a certified tax e-invoice. Provider/API integration remains a separate approved phase.
- Tests added for print HTML escaping and content, schema sale-price validation and demo sale-price data. CI + owner Termux/Android acceptance pending. No merge/deploy.

- CI run #409 (`45582461715`, commit `9ac51e52c296faa6b7d5f48cc2b02a722643a2dc`): PASS – Typecheck, Lint, Unit tests, Production build/PWA.
- Owner Termux/Android smoke test and print-to-PDF acceptance: pending. PR #28 remains Draft; no merge/deploy.


## Phase 33 – Owner Luxury Emerald Glass & PWA shell – 2026-11-25
- Branch: `phase-33-owner-luxury-emerald-glass-pwa-shell`; base: Phase 32 head `2e65f4d68925ef3786c9a5830cbff61352f42d2b` (PR #28 remains Draft; no merge/deploy).
- Design direction approved: Luxury Emerald Glass – deep emerald translucent glass, champagne-gold accents.
- Added global decorative video layer reading `/videos/videosalo.mp4`; muted, autoplay, loop, playsInline; gradient overlay remains the fallback when the MP4 is absent.
- Added animated sidebar interactions: subtle horizontal hover motion, emerald/champagne active state, soft active pulse, independent desktop scroll; horizontal scroll-snap navigation on mobile.
- Added responsive glass surfaces for main header, cards, forms, assistant panels and authentication; reduced-motion and forced-colors handling.
- Added SVG icon set and directories: `public/icons/`, `public/videos/`, `public/brand/`; video file itself must be supplied by Owner at `public/videos/videosalo.mp4`.
- PWA manifest theme updated to emerald; icon entries include scalable SVG 192/512/maskable. Apple touch SVG is a vector placeholder; PNG export may be needed for strict iOS compatibility.
- Documentation: `docs/design/LUXURY-EMERALD-GLASS.md`.
- No business logic, routes, auth, tenant scope, Dexie or Firebase behavior intentionally changed.
- Validation: pending CI typecheck/lint/tests/build and Owner Android/Termux + desktop/iOS visual acceptance. Do not mark Owner project complete until those checks pass.
- Employee App remains Phase 2 and must be started only after Owner acceptance; no employee UI is included in this phase.


## Phase 34 – Professional Analytics & thân thiện hóa Owner UX – 2026-11-25
- Branch: `phase-34-owner-analytics-and-friendly-vietnamese-ux`, base Phase 33 `phase-33-owner-luxury-emerald-glass-pwa-shell`.
- Added reusable SVG analytics visualization for the Reports page: smooth multi-series lines, gold area fill, grid/axis labels, per-point exact-value tooltips, legend and period totals; series use actual collected payments, refunds and expenses returned from tenant-scoped repositories.
- Applied a unified emerald glass + champagne visual layer to Owner workspace surfaces, sidebar, forms, cards, reports and controls; retained responsive layouts, reduced-motion and forced-colors handling.
- Reworded Owner-facing workspace labels, customer/product custom fields, device status, backup/restore guidance, demo-data notices and assistant confirmations in natural Vietnamese; added practical examples and helper explanations so non-technical salon owners understand what to enter and why.
- No database schema, tenant boundary, authentication, business calculations, Firebase rules or stored records intentionally changed.
- Validation status: NOT YET VERIFIED. GitHub Actions must pass typecheck/lint/unit tests/build; owner must smoke-test Android/Termux and desktop. Do not mark PASS or merge/deploy before evidence. 
