# Quyết định kiến trúc: Local-first với Firebase Sync Hub

Ngày: 2026-11-28
Branch: `phase-47-local-first-device-sync-hub`
Trạng thái: Đã chốt định hướng; transport và nghiệm thu thiết bị chưa hoàn tất.

## Quyết định mới nhất của Owner

Mỗi máy tính, laptop, iPhone và Android giữ dữ liệu salon làm việc chính trong IndexedDB của chính thiết bị đó. Firebase không phải kho dữ liệu nghiệp vụ chính. Firebase chịu trách nhiệm Auth, membership, xác minh quyền, danh tính/duyệt thiết bị và điều phối việc phân phối các gói thay đổi được phép.

Quyết định này thay thế phần "P2P-only, không dùng Firebase làm relay" trong ghi chú kiến trúc ngày 2026-11-23. Không thay đổi nguyên tắc local-first và không cho phép Firebase trở thành bản dữ liệu chính.

## Ranh giới dữ liệu

- Local IndexedDB: bản dữ liệu làm việc chính trên từng thiết bị; repositories nghiệp vụ tiếp tục đọc/ghi tại đây.
- Firebase Auth + Firestore control plane: xác thực UID, membership salon/Owner, registry thiết bị, trạng thái phê duyệt, cursor/manifest đồng bộ và điều phối quyền.
- Relay envelopes (nếu triển khai): chỉ chứa payload đã mã hóa đầu-cuối, có salonId/device identity, sequence/revision, checksum và thời hạn sống ngắn; không chứa dữ liệu rõ, không phải nguồn dữ liệu chính.
- ENA memory: bộ nhớ cục bộ theo salon + Owner; phần được phép chia sẻ được đóng gói mã hóa và đồng bộ qua cùng giao thức. Không gửi hồ sơ khách/PII hoặc toàn bộ lịch sử chat cho Gemini.
- Backup: bản sao lưu mã hóa độc lập do Owner kiểm soát; không phụ thuộc việc relay còn tồn tại.

## Luồng đồng bộ mục tiêu

1. Repository ghi nghiệp vụ thành công vào IndexedDB và tạo change record/outbox trong cùng transaction.
2. Sync worker đóng gói thay đổi, mã hóa bằng khóa salon/thiết bị và gửi envelope lên kênh relay được Firestore Rules giới hạn theo membership + device approval.
3. Firebase xác thực và phân phối envelope/cursor tới thiết bị đích; không giải mã payload.
4. Thiết bị nhận xác minh tenant, peer, sequence, checksum, schema và quyền trước khi giải mã/áp dụng vào IndexedDB.
5. ACK/cursor được ghi nhận; envelope hết hạn được dọn theo TTL. Khi offline, outbox ở local và tiếp tục khi kết nối.
6. Conflict dùng quy tắc theo loại dữ liệu; không dùng last-write-wins mù quáng cho hóa đơn, thanh toán, hoàn tiền và tồn kho.

## Quy tắc an toàn và giới hạn

- Không đồng bộ dữ liệu giữa hai salon hoặc hai Owner; đổi tài khoản phải đóng scope cũ.
- Firebase Rules phải fail-closed; chỉ thiết bị đã được Owner duyệt mới gửi/nhận envelope.
- Payload relay luôn mã hóa đầu-cuối; Firestore Rules không thể thay thế xác minh mật mã và validation ở client.
- Firebase relay tạm thời vẫn có quota/chi phí và giới hạn kích thước; cần batch nhỏ, TTL, backpressure, retry idempotent và giám sát quota.
- Không hứa dung lượng vô hạn. PWA chỉ kiểm tra được quota storage của origin/app và lỗi ghi cục bộ, không phải toàn bộ dung lượng trống vật lý trên mọi iPhone/Android/desktop.
- Khi thiết bị gần đầy, ENA cảnh báo, dừng tải dữ liệu không cần thiết và chỉ dọn cache có thể tái tạo; tuyệt đối không tự xóa dữ liệu nghiệp vụ chưa đồng bộ.

## Các phần đã có và còn thiếu

Đã có từ các phase trước: IndexedDB local-first, device/changeLog/syncCursor/conflict stores, protocol mã hóa AES-GCM + PBKDF2, kiểm tra salonId/peerDeviceId, UI quản lý thiết bị/xung đột và backup mã hóa.

Còn thiếu: outbox được ghi nguyên tử cùng mọi repository nghiệp vụ; Firebase relay/control-plane schema + Firestore Rules; transport upload/download; ACK/cursor; retry/offline; idempotency; conflict policy theo nghiệp vụ; ENA memory sync; quota/device health notifications; test đa thiết bị và nghiệm thu thực tế trên Windows/macOS? desktop, iPhone Safari/PWA và Android PWA.

Không được tuyên bố đồng bộ đa thiết bị đã hoạt động cho đến khi các phần còn thiếu được triển khai và kiểm thử.

## Bảo vệ dữ liệu khi gần hết dung lượng

- Theo dõi navigator.storage.estimate() và navigator.storage.persist() khi trình duyệt hỗ trợ.
- Ngưỡng cảnh báo dựa trên quota origin và lỗi ghi, ghi rõ đây không phải free-space toàn thiết bị.
- Cache và bản sao có thể tải lại được ưu tiên dọn; outbox chưa ACK, dữ liệu salon và backup không tự xóa.
- Nếu local write thất bại, báo lỗi trước khi xác nhận thao tác thành công; không âm thầm chuyển sang ghi cloud.
