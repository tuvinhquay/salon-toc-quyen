# Triển khai Salon [TÓC QUYỀN]

## 1. Firebase project
Dự án Firebase đúng của ứng dụng: `salonquyen-f21fa`.

Trước khi triển khai, kiểm tra:
```bash
firebase use
cat .firebaserc
```
Không triển khai nếu project đang chọn không phải `salonquyen-f21fa`. Có thể chỉ định project rõ ràng trong lệnh deploy để tránh nhầm môi trường.

## 2. Cấu hình Authentication và App Check
- Bật Google provider trong Firebase Authentication.
- Thêm domain Hosting vào Authorized domains.
- App Check dùng reCAPTCHA Enterprise nếu Gemini adviser được bật. Site key chỉ là public web configuration; không đưa secret vào frontend.
- Gemini được gọi tùy chọn qua Firebase AI Logic. Không thêm GEMINI_API_KEY vào frontend, .env.local, GitHub hoặc chat.

## 3. Owner onboarding và Firestore Rules
- Tài khoản Google mới tự tạo salon lần đầu.
- Ứng dụng ghi salon và membership trong cùng một Firestore batch.
- Firestore Rules chỉ chấp nhận Google UID tự tạo membership của chính UID đó khi salon tương ứng được tạo đồng thời và ownerUid/salonId khớp.
- Membership đã tồn tại không thể bị ghi đè; client không thể đổi role, cập nhật hoặc xóa membership/salon.
- Không cần Cloud Functions, Cloud Functions API, Secret Manager hay gói Blaze cho luồng onboarding này.

## 4. Kiểm tra frontend
```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

## 5. Triển khai Rules
Chỉ triển khai Firestore Rules sau khi đã kiểm tra branch và project:
```bash
firebase deploy --only firestore:rules --project salonquyen-f21fa
```
Lệnh trên chỉ triển khai Firestore Rules, không triển khai Functions hoặc Hosting.

## 6. Hosting (khi cần phát hành phiên bản mới)
```bash
firebase deploy --only hosting --project salonquyen-f21fa
```

## 7. Kiểm thử sau triển khai
- Đăng xuất tài khoản phát triển khỏi ứng dụng.
- Đăng nhập bằng Google của chủ tiệm mới và tạo salon.
- Tải lại trang, xác nhận vẫn vào đúng salon.
- Đăng xuất và đăng nhập lại; xác nhận membership được đọc đúng.
- Dùng một Google UID khác: phải nhận salonId khác và không đọc được salon metadata của salon đầu tiên.
- Kiểm tra bot nội bộ, trí nhớ local, lịch hẹn, khách hàng, nhân viên, kho, POS và báo cáo.
- Dữ liệu IndexedDB chỉ nằm trên thiết bị hiện tại; cần backup/restore riêng khi bàn giao thiết bị.
