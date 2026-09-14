import { api } from './api';
import { KEYS, saveJSON } from '../utils/storage';

export async function getFarmerProfile() {
  try {
    const data = await api('/api/profile');
    if (data.profile) await saveJSON(KEYS.profile, data.profile);
    return data.profile;
  } catch {
    return null;
  }
}

export async function saveFarmerProfile(profile) {
  const data = await api('/api/profile', { method: 'PUT', body: profile });
  await saveJSON(KEYS.profile, data.profile);
  return data.profile;
}
