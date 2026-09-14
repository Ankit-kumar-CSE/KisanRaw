import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { bankLabel } from '../lib/mappers.js';

const router = Router();
router.use(requireAuth);

router.get('/:bookingId', asyncHandler(async (req, res) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', req.params.bookingId)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new HttpError(404, 'booking_not_found');

  const total = booking.total_amount != null
    ? Number(booking.total_amount)
    : Number(booking.quantity) * Number(booking.rate);

  res.json({
    success: true,
    payment: {
      bookingId: booking.booking_id,
      crop: booking.crop,
      quantity: Number(booking.quantity),
      rate: Number(booking.rate),
      total,
      status: booking.status,
      txnId: booking.txn_id || null,
      bank: bankLabel(req.user),
    },
  });
}));

export default router;
