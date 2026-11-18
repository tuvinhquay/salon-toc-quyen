# Triển khai Salon [TÓC QUYỀN]

## 1. Cấu hình local
- Tạo file .env.local từ .env.example và điền Firebase Web config cùng reCAPTCHA Enterprise site key.
- Không đưa GEMINI_API_KEY vào .env.local, trình duyệt, GitHub hoặc chat.
- Bật Google Authentication trong Firebase Authentication.
- Bật App Check với reCAPTCHA Enterprise cho Web; thêm domain local/production phù hợp.
- Owner membership phải được tạo bằng quy trình tin cậy phía quản trị; client không có quyền tự cấp role Owner.

## 2. Cài Firebase CLI trên Termux
```bash
npm install -g firebase-tools
firebase login
firebase use salon-quyen
```

## 3. Cài secret Gemini ở Firebase
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
Firebase CLI sẽ hỏi giá trị secret trực tiếp trong terminal. Không gửi giá trị này vào ChatGPT và không commit.

## 4. Kiểm tra trước deploy
```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm --prefix functions install
npm --prefix functions run build
```

## 5. Deploy
```bash
firebase deploy --only firestore:rules,functions,hosting
```

## 6. Kiểm tra sau deploy
- Kiểm tra Hosting PWA qua HTTPS.
- Kiểm tra Google sign-in và membership Owner.
- Kiểm tra App Check token được gửi tới callable function.
- Kiểm tra salonAssistant trả lời được, từ chối user chưa có Owner membership và rate-limit sau 10 yêu cầu/phút.
- Không nhập dữ liệu khách hàng/thanh toán thật trong smoke test ban đầu.

## Secrets và quyền
- Gemini key chỉ được đọc bởi Cloud Function qua Secret Manager.
- Callable function bắt buộc Firebase Auth + App Check + membership active/owner.
- Prompt/context không được lưu vào Firestore hoặc log; chỉ metadata giới hạn lượt gọi được lưu.
- PWA frontend không chứa Gemini key.
