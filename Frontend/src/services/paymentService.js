// PAYMENT SERVICE — mock payment status derived from the booking record.
// Replace with GET /api/payments/:bookingId later.
import { delay } from '../utils/storage';
import { getBooking } from './bookingService';

export async function getPaymentStatus(bookingId) {
  await delay(800);
  const b = await getBooking(bookingId);
  if (!b) return null;
  const total = b.totalAmount ? Number(b.totalAmount) : b.quantity * b.rate;
  return {
    bookingId,
    crop: b.crop,
    quantity: b.quantity,
    rate: b.rate,
    total,
    status: b.status, // payment-completed | payment-initiated | earlier
    txnId: b.txnId || null,
    bank: 'Punjab National Bank •••• 4821',
  };
}
