// AUTH SERVICE — mock implementation.
// To connect the real backend later: replace each function body with a fetch()
// to the corresponding endpoint; signatures stay the same.
import { delay, loadJSON, saveJSON, KEYS } from '../utils/storage';

const DEMO_OTP = '123456';
const OTP_TTL_MS = 60 * 1000;

let pendingOtp = null; // { otp, mobile, expiresAt }

export async function sendOTP(mobile) {
  await delay(900);
  pendingOtp = { otp: DEMO_OTP, mobile, expiresAt: Date.now() + OTP_TTL_MS };
  return { success: true, demoOtp: DEMO_OTP, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyOTP(mobile, otp) {
  await delay(800);
  if (!pendingOtp || pendingOtp.mobile !== mobile) {
    return { success: false, error: 'not_requested' };
  }
  if (Date.now() > pendingOtp.expiresAt) {
    return { success: false, error: 'expired' };
  }
  if (otp !== pendingOtp.otp) {
    return { success: false, error: 'incorrect' };
  }
  const session = { mobile, loggedInAt: new Date().toISOString() };
  await saveJSON(KEYS.session, session);
  const profile = await loadJSON(KEYS.profile, null);
  pendingOtp = null;
  return { success: true, session, hasProfile: !!profile };
}

export async function getSession() {
  return loadJSON(KEYS.session, null);
}

export async function logout() {
  await saveJSON(KEYS.session, null);
  return { success: true };
}
