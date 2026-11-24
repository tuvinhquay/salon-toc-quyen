# P27 – Bàn giao Owner và onboarding không dùng Cloud Functions
Ngày: 2026-11-24
Branch: `phase-27-owner-handover-no-functions`
Base: `phase-26-owner-onboarding-clean-ui`

## Mục tiêu
Tách tài khoản phát triển khỏi tài khoản chủ tiệm. Người nhận bàn giao có thể đăng nhập bằng Google cá nhân và tự tạo salon/tenant riêng, không cần tài khoản người phát triển cấp quyền thủ công.

## Thay đổi
- Thay callable `createOwnerSalon` bằng Firestore `writeBatch` tạo đồng thời `salons/{salonId}` và `memberships/{uid}`.
- Firestore Rules chỉ cho phép Google-authenticated UID chưa có membership tạo membership của chính UID đó, khi salon tương ứng được tạo trong cùng batch và có ownerUid/salonId khớp.
- Cấm client tạo membership riêng lẻ, ghi đè membership, đổi role, cập nhật/xóa salon hoặc membership.
- Gỡ Firebase Functions SDK khỏi frontend; xóa cấu hình Functions khỏi `firebase.json`; loại bước cài/build Functions khỏi CI; xóa source/package/tsconfig Functions không còn được dùng.
- Giữ nguyên luồng Google sign-in, switch account và sign out.

## Ảnh hưởng bot và module
- Không sửa `AssistantPage`, assistant-local, assistant-brain, assistant-memory, assistant-context hoặc assistant-gemini.
- Bot nghiệp vụ và trí nhớ tiếp tục chạy local-first trong Dexie/IndexedDB theo salonId + Owner UID.
- Gemini vẫn là cố vấn tùy chọn qua Firebase AI Logic; không gọi Cloud Functions.
- Không sửa Dexie schema, các module khách hàng/lịch hẹn/quy trình/nhân viên/kho/POS/báo cáo/backup.
- Không xóa dữ liệu hiện tại, không thay đổi membership hoặc salon hiện có.

## Triển khai và kiểm thử còn chờ
- Chạy GitHub Actions và kiểm tra Termux: typecheck, lint, tests, build/PWA.
- Kiểm thử Firestore Rules bằng Firebase Emulator hoặc project test: cho phép batch đúng; từ chối membership đơn lẻ, salon không khớp UID, tạo tenant thứ hai cùng UID, update/delete và user không đăng nhập Google.
- Chỉ deploy `firestore.rules` lên đúng project `salonquyen-f21fa` sau khi kiểm thử.
- Smoke test: đăng xuất tài khoản phát triển, đăng nhập Google chủ tiệm, tạo salon, reload, đăng xuất và đăng nhập lại; xác nhận UID khác nhận salonId khác và không đọc được salon metadata của tài khoản kia.
- P27 chưa PASS cho tới khi CI, Rules và kiểm thử Android/Termux đều đạt.
