/**
 * Firebase client SDK — Phone Authentication
 * ─────────────────────────────────────────────────────────────────────────
 * Initialises Firebase with environment variables and exports the auth
 * instance + phone OTP helpers used by Login, Register, and Settings.
 *
 * Required VITE_ env vars (set in .env or Vercel dashboard):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_APP_ID
 * ─────────────────────────────────────────────────────────────────────────
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey:      import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:   import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:       import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── reCAPTCHA setup ──────────────────────────────────────────────────────
// Firebase Phone Auth requires a reCAPTCHA verifier. We use an *invisible*
// reCAPTCHA so users don't see an extra challenge box.

let recaptchaVerifier = null;

/**
 * Lazily create (or re-create) a global invisible reCAPTCHA verifier.
 * The `containerId` must exist in the DOM when this is called — the
 * calling component should render a hidden <div id="recaptcha-container" />.
 */
export function getRecaptchaVerifier(containerId = 'recaptcha-container') {
  let el = null;
  // If the container element doesn't exist in DOM, create it dynamically
  if (typeof document !== 'undefined') {
    el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      document.body.appendChild(el);
    }
  }

  // If the old verifier was cleared / the DOM element was removed,
  // we must build a fresh one.
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (_) {
      // already cleared — ignore
    }
    recaptchaVerifier = null;
  }

  if (el) {
    el.innerHTML = '';
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — signInWithPhoneNumber will proceed
    },
  });

  return recaptchaVerifier;
}

/**
 * Auto-format a phone number to standard international E.164 format.
 * If 10 digits are provided without a country code, defaults to India (+91).
 */
export function formatToE164(phone) {
  if (!phone) return '';
  let clean = String(phone).trim().replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) {
    return clean;
  }
  // Strip leading 0 if present (e.g., 09876543210 -> 9876543210)
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  // 10 digits -> +91XXXXXXXXXX
  if (/^\d{10}$/.test(clean)) {
    return `+91${clean}`;
  }
  // 12 digits starting with 91 -> +91XXXXXXXXXX
  if (/^91\d{10}$/.test(clean)) {
    return `+${clean}`;
  }
  return clean.startsWith('+') ? clean : `+${clean}`;
}

/**
 * Send a phone OTP via Firebase.
 * Returns a `ConfirmationResult` whose `.confirm(code)` method verifies.
 *
 * @param {string} phone  e.g. "9999999999" or "+919999999999"
 * @returns {Promise<import('firebase/auth').ConfirmationResult>}
 */
export async function sendPhoneOtp(phone) {
  const formattedPhone = formatToE164(phone);
  const verifier = getRecaptchaVerifier();
  return signInWithPhoneNumber(auth, formattedPhone, verifier);
}

/**
 * After the user enters the 6-digit code, call this to get a Firebase
 * ID token that the backend can verify.
 *
 * @param {string} verificationId  From confirmationResult.verificationId
 * @param {string} code            The 6-digit OTP the user entered
 * @returns {Promise<string>}      Firebase ID token (JWT)
 */
export async function verifyPhoneOtpAndGetToken(verificationId, code) {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const userCred   = await signInWithCredential(auth, credential);
  return userCred.user.getIdToken();
}

export { auth };
