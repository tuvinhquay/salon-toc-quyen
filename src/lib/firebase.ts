import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const firebaseEnvDiagnostics = {
  apiKeyPresent: Boolean(config.apiKey?.trim()),
  authDomainPresent: Boolean(config.authDomain?.trim()),
  projectId: config.projectId || '',
  storageBucketPresent: Boolean(config.storageBucket?.trim()),
  messagingSenderIdPresent: Boolean(config.messagingSenderId?.trim()),
  appIdPresent: Boolean(config.appId?.trim()),
  recaptchaSiteKeyPresent: Boolean(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim()),
  expectedProject: config.projectId === 'salonquyen-f21fa',
  appCheckMode: import.meta.env.DEV ? 'debug' : 'recaptcha-enterprise',
}
export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
export const firebaseApp = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY

// Local Vite development (including localhost on Android/Termux) is not a
// production-attested web origin. Firebase's App Check debug provider is
// selected by this flag, while production builds continue using reCAPTCHA
// Enterprise. The generated debug token must be safelisted in Firebase Console.
if (import.meta.env.DEV && typeof globalThis !== 'undefined') {
  ;(globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean })
    .FIREBASE_APPCHECK_DEBUG_TOKEN = true
}

export const appCheck = firebaseApp && recaptchaSiteKey ? initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
  isTokenAutoRefreshEnabled: true,
}) : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null
