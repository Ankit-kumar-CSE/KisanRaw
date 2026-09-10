// BOOKING SERVICE — mock booking lifecycle, persisted locally.
// Replace with POST /api/bookings etc. later. Status chain:
// confirmed → checked-in → in-queue → processing → procurement-completed → payment-initiated → payment-completed
import { delay, loadJSON, saveJSON, KEYS } from '../utils/storage';

export const MSP_RATES = { Wheat: 2275, Paddy: 2183, Maize: 2500 };
export const STAGES = ['confirmed', 'checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated', 'payment-completed'];

export async function getBookings() {
  return loadJSON(KEYS.bookings, []);
}

export async function getBooking(bookingId) {
  const all = await getBookings();
  return all.find((b) => b.bookingId === bookingId) || null;
}

export async function getActiveBooking() {
  const all = await getBookings();
  return all.find((b) => !['payment-completed', 'cancelled'].includes(b.status)) || null;
}

export async function createBooking({ centre, crop, quantity, dateISO, slot, slotLabel }) {
  await delay(1400); // booking confirmation loading state
  const all = await getBookings();
  const today = new Date();
  const ymd = dateISO.replaceAll('-', '').slice(0, 8);
  const num = 240 + all.length + 1;
  const rand = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZK23456789KX'[(Math.random() * 32) | 0]).join('');
  const booking = {
    bookingId: `KR-${ymd}-A${num}-${rand}`,
    token: `A-${num}`,
    farmer: 'Raj Kumar',
    centreId: centre.id,
    centreName: centre.name,
    centreAddress: centre.address,
    crop,
    quantity,
    dateISO,
    slotId: slot.id,
    slotLabel,
    rate: MSP_RATES[crop] || 2275,
    status: 'confirmed',
    createdAt: today.toISOString(),
    estProcessingMins: Math.max(15, Math.round(quantity * 0.5) + 5),
  };
  await saveJSON(KEYS.bookings, [booking, ...all]);
  return booking;
}

export async function cancelBooking(bookingId) {
  await delay(600);
  const all = await getBookings();
  const next = all.map((b) => (b.bookingId === bookingId ? { ...b, status: 'cancelled' } : b));
  await saveJSON(KEYS.bookings, next);
  return next;
}

// Demo-only helper: advances a booking to the next lifecycle stage so the
// farmer journey can be demonstrated without a backend.
export async function simulateNextStage(bookingId) {
  await delay(700);
  const all = await getBookings();
  const next = all.map((b) => {
    if (b.bookingId !== bookingId) return b;
    const idx = STAGES.indexOf(b.status);
    const stage = STAGES[Math.min(idx + 1, STAGES.length - 1)];
    const patch = { status: stage };
    if (stage === 'procurement-completed') {
      patch.actualQuantity = b.quantity; // ideal case: matches declared
      patch.qualityGrade = 'A (FAQ)';
      patch.totalAmount = (b.quantity * b.rate).toFixed(2);
    }
    if (stage === 'payment-completed') {
      patch.txnId = `KR-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    return { ...b, ...patch };
  });
  await saveJSON(KEYS.bookings, next);
  return next;
}

// Seed one realistic completed booking so history/payments are demonstrable.
export async function seedHistory() {
  const existing = await loadJSON(KEYS.bookings, []);
  if (existing.length) return existing;
  const d = new Date();
  d.setDate(d.getDate() - 8);
  const seed = [{
    bookingId: 'KR-20260902-A231-M4PQ',
    token: 'A-231',
    farmer: 'Raj Kumar',
    centreId: 'KR-PHK-01',
    centreName: 'Phagwara Procurement Centre',
    centreAddress: 'Grand Trunk Rd, Focal Point, Phagwara, Kapurthala, Punjab',
    crop: 'Paddy',
    quantity: 38.5,
    dateISO: d.toISOString().slice(0, 10),
    slotId: 's1', slotLabel: '08:00 AM – 10:00 AM',
    rate: 2183,
    status: 'payment-completed',
    actualQuantity: 38.5,
    qualityGrade: 'A (FAQ)',
    totalAmount: '84045.50',
    txnId: 'KR-PAY-583102',
    createdAt: d.toISOString(),
    estProcessingMins: 25,
  }];
  await saveJSON(KEYS.bookings, seed);
  return seed;
}
