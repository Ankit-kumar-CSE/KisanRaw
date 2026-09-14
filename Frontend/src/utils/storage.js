// Thin AsyncStorage wrappers — single place to change persistence later.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  onboarding: 'kr_onboarding_done',
  session: 'kr_session',
  token: 'kr_token',
  profile: 'kr_profile',
  bookings: 'kr_bookings',
  notifications: 'kr_notifications',
};

export async function loadJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — demo continues in memory */
  }
}

export async function removeKey(key) {
  try { await AsyncStorage.removeItem(key); } catch { /* ignore */ }
}

// Simulated network latency so loading states are demonstrable.
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
