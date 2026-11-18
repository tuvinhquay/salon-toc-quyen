# Deployment và environment

## Frontend public config
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_FIREBASE_MEASUREMENT_ID.

## Server-only secrets
GEMINI_API_KEY, TURN_SERVER_URL, TURN_USERNAME, TURN_CREDENTIAL và secret ký server nếu cần. Không dùng tiền tố VITE_.

Repository hiện Public. Không commit .env hoặc secrets. Cấu hình secret trong GitHub Actions/Vercel project settings. Gemini chỉ được bật khi secret đã được cài ở server runtime và endpoint có kiểm thử.