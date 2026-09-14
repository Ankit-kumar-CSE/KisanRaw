import { api } from './api';

export const MSP_RATES = { Wheat: 2275, Paddy: 2183, Maize: 2500 };
export const STAGES = ['confirmed', 'checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated', 'payment-completed'];

export async function getBookings() {
  const data = await api('/api/bookings');
  return data.bookings || [];
}

export async function getBooking(bookingId) {
  try {
    const data = await api(`/api/bookings/${encodeURIComponent(bookingId)}`);
    return data.booking || null;
  } catch {
    return null;
  }
}

export async function getActiveBooking() {
  const data = await api('/api/bookings/active');
  return data.booking || null;
}

export async function createBooking({ centre, crop, quantity, dateISO, slot, slotLabel }) {
  const data = await api('/api/bookings', {
    method: 'POST',
    body: {
      centreId: centre.id,
      crop,
      quantity,
      dateISO,
      slotId: slot.id,
      slotLabel: slotLabel || slot.label,
    },
  });
  return data.booking;
}

export async function cancelBooking(bookingId) {
  const data = await api(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: 'POST' });
  return data.bookings || [];
}

export async function simulateNextStage(bookingId) {
  const data = await api(`/api/bookings/${encodeURIComponent(bookingId)}/advance`, { method: 'POST' });
  return data.bookings || [];
}

export async function seedHistory() {
  return getBookings();
}
