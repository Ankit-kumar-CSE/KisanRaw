import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { mapBooking } from '../lib/mappers.js';
import { bookingIdFor, STAGES } from '../lib/tokens.js';
import { ensureSlots } from '../lib/slots.js';

const router = Router();
router.use(requireAuth);

function isComplete(profile) {
  return !!(profile.name && profile.village);
}

router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ success: true, bookings: (data || []).map(mapBooking) });
}));

router.get('/active', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('profile_id', req.user.id)
    .in('status', ['confirmed', 'checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  res.json({ success: true, booking: mapBooking(data) });
}));

router.get('/:bookingId', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', req.params.bookingId)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'booking_not_found');
  res.json({ success: true, booking: mapBooking(data) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile || !isComplete(profile)) throw new HttpError(400, 'profile_incomplete');

  const { centreId, crop, quantity, dateISO, slotId, slotLabel } = req.body || {};
  const qty = Number(quantity);
  if (!centreId || !crop || !dateISO || !slotId) throw new HttpError(400, 'missing_fields');
  if (!Number.isFinite(qty) || qty <= 0 || qty > 500) throw new HttpError(400, 'invalid_quantity');

  const { data: centre, error: cErr } = await supabase.from('centres').select('*').eq('id', centreId).maybeSingle();
  if (cErr) throw cErr;
  if (!centre) throw new HttpError(404, 'centre_not_found');
  if (centre.status === 'closed') throw new HttpError(400, 'centre_closed');

  const { data: rateRow } = await supabase.from('crop_rates').select('*').eq('crop', crop).maybeSingle();
  const rate = Number(rateRow?.rate_per_qtl || 2275);

  const slots = await ensureSlots(centreId, dateISO);
  const slot = slots.find((s) => s.slot_id === slotId);
  if (!slot) throw new HttpError(400, 'invalid_slot');
  if (slot.status === 'closed' || slot.status === 'full' || slot.booked_count >= slot.capacity) {
    throw new HttpError(409, 'slot_full');
  }

  const { data: existingActive } = await supabase
    .from('bookings')
    .select('id')
    .eq('profile_id', req.user.id)
    .in('status', ['confirmed', 'checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated'])
    .limit(1)
    .maybeSingle();
  if (existingActive) throw new HttpError(409, 'active_booking_exists');

  const { data: last } = await supabase
    .from('bookings')
    .select('token_num')
    .eq('centre_id', centreId)
    .eq('date_iso', dateISO)
    .order('token_num', { ascending: false })
    .limit(1)
    .maybeSingle();
  const tokenNum = (last?.token_num || 240) + 1;
  const token = `A-${tokenNum}`;
  const bookingId = bookingIdFor(dateISO, tokenNum);

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      booking_id: bookingId,
      token,
      token_num: tokenNum,
      profile_id: req.user.id,
      farmer_name: profile.name,
      centre_id: centre.id,
      centre_name: centre.name,
      centre_address: centre.address,
      crop,
      quantity: qty,
      date_iso: dateISO,
      slot_id: slotId,
      slot_label: slotLabel || slotId,
      rate,
      status: 'confirmed',
      est_processing_mins: Math.max(15, Math.round(qty * 0.5) + 5),
    })
    .select('*')
    .single();
  if (bErr) throw bErr;

  await supabase
    .from('centre_slot_days')
    .update({ booked_count: slot.booked_count + 1 })
    .eq('centre_id', centreId)
    .eq('date', dateISO)
    .eq('slot_id', slotId);

  await supabase.from('notifications').insert({
    profile_id: req.user.id,
    category: 'booking',
    text: `Your slot is confirmed for ${dateISO} at ${slotLabel || slotId}.`,
  });

  res.status(201).json({ success: true, booking: mapBooking(booking) });
}));

router.post('/:bookingId/cancel', asyncHandler(async (req, res) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', req.params.bookingId)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new HttpError(404, 'booking_not_found');
  if (booking.status !== 'confirmed') throw new HttpError(400, 'cannot_cancel');

  const { error: uErr } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', booking.id);
  if (uErr) throw uErr;

  const { data: slot } = await supabase
    .from('centre_slot_days')
    .select('*')
    .eq('centre_id', booking.centre_id)
    .eq('date', booking.date_iso)
    .eq('slot_id', booking.slot_id)
    .maybeSingle();
  if (slot && slot.booked_count > 0) {
    await supabase
      .from('centre_slot_days')
      .update({ booked_count: slot.booked_count - 1 })
      .eq('centre_id', booking.centre_id)
      .eq('date', booking.date_iso)
      .eq('slot_id', booking.slot_id);
  }

  const { data: all } = await supabase
    .from('bookings')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  res.json({ success: true, bookings: (all || []).map(mapBooking) });
}));

router.post('/:bookingId/advance', asyncHandler(async (req, res) => {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_id', req.params.bookingId)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!booking) throw new HttpError(404, 'booking_not_found');
  const idx = STAGES.indexOf(booking.status);
  if (idx < 0 || booking.status === 'cancelled') throw new HttpError(400, 'cannot_advance');
  const stage = STAGES[Math.min(idx + 1, STAGES.length - 1)];
  const patch = { status: stage };
  if (stage === 'procurement-completed') {
    patch.actual_quantity = booking.quantity;
    patch.quality_grade = 'A (FAQ)';
    patch.total_amount = Number(booking.quantity) * Number(booking.rate);
  }
  if (stage === 'payment-completed') {
    patch.txn_id = `KR-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  const { error: uErr } = await supabase.from('bookings').update(patch).eq('id', booking.id);
  if (uErr) throw uErr;

  const { data: all } = await supabase
    .from('bookings')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  res.json({ success: true, bookings: (all || []).map(mapBooking) });
}));

export default router;
