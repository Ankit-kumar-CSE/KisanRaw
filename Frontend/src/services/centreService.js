import { api } from './api';

export async function getProcurementCentres() {
  const data = await api('/api/centres', { auth: false });
  return data.centres || [];
}

export async function getCentre(centreId) {
  try {
    const data = await api(`/api/centres/${encodeURIComponent(centreId)}`, { auth: false });
    return data.centre || null;
  } catch {
    return null;
  }
}

export async function getAvailableSlots(centreId, dateISO) {
  const data = await api(`/api/centres/${encodeURIComponent(centreId)}/slots?date=${encodeURIComponent(dateISO)}`, { auth: false });
  return data.slots || [];
}

export async function getDayAvailability(centreId, dateISO) {
  const data = await api(`/api/centres/${encodeURIComponent(centreId)}/availability?date=${encodeURIComponent(dateISO)}`, { auth: false });
  return data.status || 'available';
}
