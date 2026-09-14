import { Platform } from 'react-native';
import { KEYS, loadJSON, saveJSON } from '../utils/storage';

const FALLBACK_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL || FALLBACK_HOST).replace(/\/$/, '');

export async function getToken() {
  return loadJSON(KEYS.token, null);
}

export async function setToken(token) {
  await saveJSON(KEYS.token, token);
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: 'invalid_response' };
  }
  if (!res.ok) {
    const err = new Error(data?.error || `http_${res.status}`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}
