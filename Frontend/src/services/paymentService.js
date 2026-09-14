import { api } from './api';

export async function getPaymentStatus(bookingId) {
  try {
    const data = await api(`/api/payments/${encodeURIComponent(bookingId)}`);
    return data.payment || null;
  } catch {
    return null;
  }
}
