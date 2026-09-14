import { api, setToken } from './api';
import { KEYS, loadJSON, saveJSON } from '../utils/storage';

export async function sendOTP(mobile) {
  return api('/api/auth/otp/send', { method: 'POST', body: { mobile }, auth: false });
}

export async function verifyOTP(mobile, otp) {
  try {
    const data = await api('/api/auth/otp/verify', { method: 'POST', body: { mobile, otp }, auth: false });
    await setToken(data.token);
    await saveJSON(KEYS.session, data.session);
    if (data.profile) await saveJSON(KEYS.profile, data.profile);
    return data;
  } catch (err) {
    return { success: false, error: err.payload?.error || err.message };
  }
}

export async function getSession() {
  const token = await loadJSON(KEYS.token, null);
  if (!token) return null;
  try {
    const data = await api('/api/auth/me');
    await saveJSON(KEYS.session, data.session);
    if (data.profile) await saveJSON(KEYS.profile, data.profile);
    return data.session;
  } catch {
    await saveJSON(KEYS.token, null);
    await saveJSON(KEYS.session, null);
    return null;
  }
}

export async function logout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
  await saveJSON(KEYS.token, null);
  await saveJSON(KEYS.session, null);
  return { success: true };
}
