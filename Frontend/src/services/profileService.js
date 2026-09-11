// PROFILE SERVICE — mock farmer profile persistence.
import { delay, loadJSON, saveJSON, KEYS } from '../utils/storage';

export async function getFarmerProfile() {
  return loadJSON(KEYS.profile, null);
}

export async function saveFarmerProfile(profile) {
  await delay(900);
  const full = { ...profile, updatedAt: new Date().toISOString() };
  await saveJSON(KEYS.profile, full);
  return full;
}
