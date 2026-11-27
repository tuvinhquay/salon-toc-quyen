# Phase 41 – App Check debug provider for local Vite/Termux

Date: 2026-11-27
Branch: `phase-41-app-check-local-debug-provider`
Base: `phase-40-gemini-role-aware-assistant-routing`
Purpose: fix Firebase AI Logic App Check token rejection during local development on localhost/127.0.0.1, including Android + Termux.

## Root cause
Gemini request reaches `firebasevertexai.googleapis.com`, but Firebase returns `401 Firebase App Check token is invalid`. Localhost development can fail production reCAPTCHA Enterprise attestation. Firebase's documented local-development solution is the App Check debug provider and a registered/safelisted debug token.

## Code changes
- `src/lib/firebase.ts`: in Vite development mode only, set `globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true` before `initializeAppCheck()`. Firebase SDK will issue a debug token; production build keeps reCAPTCHA Enterprise.
- Diagnostics report `appCheckMode: debug` in development and `recaptcha-enterprise` in production.
- CI workflow includes Phase 41 branch for push and PR checks.

## Required owner setup (do not paste token into chat)
1. Update this branch in Termux and restart Vite.
2. Open the app in the same browser/origin. Open browser Developer Tools console (Android Chrome can be inspected from desktop Chrome via USB remote debugging).
3. Copy the generated `AppCheck debug token` from the console. It is a secret; don't share or commit it.
4. Firebase Console project `salonquyen-f21fa` → Security → App Check → Apps → select `Salonquyen Web` → Manage debug tokens → register the token.
5. Reload the app and run Gemini connection test again. Use the same browser profile/device where the token was generated.
6. If token already generated before safelisting, reload and retry; if needed clear that browser's site data for localhost and generate/register a fresh token.

## Production
- Never deploy `FIREBASE_APPCHECK_DEBUG_TOKEN` or debug tokens to production.
- Production uses reCAPTCHA Enterprise. Confirm the site key in `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` is the same key registered to the Firebase Web App under App Check, and that the deployed hostname is included in the reCAPTCHA Enterprise key's allowed domains.
- Do not add `localhost` to the production reCAPTCHA Enterprise allowed domains.
- No Firebase Rules, Billing, API key, Gemini model, or business data changes in this phase.

## Validation
- CI: pending GitHub Actions for this branch.
- Live App Check + Gemini request: pending owner test after registering debug token.
- No merge or deployment performed.
