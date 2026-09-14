import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { mapBooking, mapProfile } from '../lib/mappers.js';
import { STAGES } from '../lib/tokens.js';

const router = Router();
router.use(requireAuth);

async function findBooking(code) {
  const raw = String(code || '').trim().replace(/[^A-Za-z0-9-]/g, '');
  if (!raw) return null;
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .or(`booking_id.eq.${raw},token.eq.${raw}`)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

router.post('/verify', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.body?.code || req.body?.bookingId);
  if (!booking) throw new HttpError(404, 'token_not_found');

  const { data: farmer } = await supabase.from('profiles').select('*').eq('id', booking.profile_id).maybeSingle();
  const { data: queue } = await supabase.from('centre_queues').select('*').eq('centre_id', booking.centre_id).maybeSingle();
  const cursor = queue?.current_token_num ?? 0;
  const ahead = Math.max(0, booking.token_num - cursor);
  const duplicate = ['checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated', 'payment-completed'].includes(booking.status);

  res.json({
    success: true,
    eligible: booking.status === 'confirmed' && !duplicate,
    duplicate,
    booking: mapBooking(booking),
    farmer: mapProfile(farmer),
    result: {
      eligible: booking.status === 'confirmed',
      token: booking.token,
      slot: booking.slot_label,
      arrival: 'On-Time',
      farmer: farmer?.name || booking.farmer_name,
      aadhaar: farmer?.aadhaar_last4 ? `•••• •••• ${farmer.aadhaar_last4}` : '•••• •••• —',
      mobile: farmer?.mobile ? `+91 ${farmer.mobile}` : '',
      vehicle: farmer?.vehicle || 'Tractor Trolley',
      vehicleType: 'Tractor Trolley',
      commodity: booking.crop,
      msp: `₹${Number(booking.rate).toLocaleString('en-IN')} / Qtl`,
      declared: Number(booking.quantity).toFixed(1),
      queuePos: `#${String(ahead).padStart(2, '0')}`,
      estWeigh: `${Math.max(8, ahead * 4)} Mins`,
      bookingId: booking.booking_id,
      centreName: booking.centre_name,
      status: booking.status,
    },
  });
}));

router.post('/check-in', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.body?.code || req.body?.bookingId);
  if (!booking) throw new HttpError(404, 'token_not_found');
  if (booking.status !== 'confirmed') throw new HttpError(400, 'already_checked_in');

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: 'checked-in', checked_in_at: new Date().toISOString() })
    .eq('id', booking.id)
    .select('*')
    .single();
  if (error) throw error;

  await supabase.from('notifications').insert({
    profile_id: booking.profile_id,
    category: 'queue',
    text: `Gate check-in confirmed for token ${booking.token}. Proceed to the live queue.`,
  });

  const { data: queue } = await supabase.from('centre_queues').select('*').eq('centre_id', booking.centre_id).maybeSingle();
  const cursor = queue?.current_token_num ?? 0;
  const ahead = Math.max(0, booking.token_num - cursor);

  res.json({
    success: true,
    booking: mapBooking(updated),
    queuePos: `#${String(ahead).padStart(2, '0')}`,
    estWeigh: `${Math.max(8, ahead * 4)} Mins`,
  });
}));

router.post('/advance', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.body?.code || req.body?.bookingId);
  if (!booking) throw new HttpError(404, 'token_not_found');
  const idx = STAGES.indexOf(booking.status);
  if (idx < 0 || booking.status === 'cancelled') throw new HttpError(400, 'cannot_advance');
  const stage = STAGES[Math.min(idx + 1, STAGES.length - 1)];
  const patch = { status: stage };
  if (stage === 'in-queue' && !booking.checked_in_at) patch.checked_in_at = new Date().toISOString();
  if (stage === 'procurement-completed') {
    patch.actual_quantity = booking.actual_quantity ?? booking.quantity;
    patch.quality_grade = booking.quality_grade || 'A (FAQ)';
    patch.total_amount = Number(booking.quantity) * Number(booking.rate);
  }
  if (stage === 'payment-completed') {
    patch.txn_id = booking.txn_id || `KR-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  const { data: updated, error } = await supabase.from('bookings').update(patch).eq('id', booking.id).select('*').single();
  if (error) throw error;
  res.json({ success: true, booking: mapBooking(updated) });
}));

router.post('/queue/next', asyncHandler(async (req, res) => {
  const centreId = req.body?.centreId || 'KR-PHK-01';
  const { data: qRow } = await supabase.from('centre_queues').select('*').eq('centre_id', centreId).maybeSingle();
  const nextNum = (qRow?.current_token_num || 0) + 1;

  if (qRow) {
    await supabase.from('centre_queues').update({ current_token_num: nextNum, updated_at: new Date().toISOString() }).eq('centre_id', centreId);
  } else {
    await supabase.from('centre_queues').insert({ centre_id: centreId, current_token_num: nextNum });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('centre_id', centreId)
    .eq('date_iso', today)
    .eq('token_num', nextNum)
    .maybeSingle();

  if (booking && ['confirmed', 'checked-in'].includes(booking.status)) {
    await supabase.from('bookings').update({ status: 'in-queue' }).eq('id', booking.id);
  }

  res.json({
    success: true,
    currentToken: `A-${nextNum}`,
    booking: mapBooking(booking),
  });
}));

router.get('/queue', asyncHandler(async (req, res) => {
  const centreId = req.query.centreId || 'KR-PHK-01';
  const today = req.query.date || new Date().toISOString().slice(0, 10);
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('centre_id', centreId)
    .eq('date_iso', today)
    .not('status', 'eq', 'cancelled')
    .order('token_num', { ascending: true });
  if (error) throw error;

  const { data: qRow } = await supabase.from('centre_queues').select('*').eq('centre_id', centreId).maybeSingle();

  const records = await Promise.all((bookings || []).map(async (b) => {
    const { data: farmer } = await supabase.from('profiles').select('*').eq('id', b.profile_id).maybeSingle();
    const statusMap = {
      confirmed: 'Waiting',
      'checked-in': 'Next In Line',
      'in-queue': 'Verification',
      processing: 'Processing',
      'procurement-completed': 'Completed',
      'payment-initiated': 'Completed',
      'payment-completed': 'Completed',
    };
    return {
      token: b.token,
      name: b.farmer_name,
      id: farmer?.farmer_id || '—',
      village: farmer?.village || '—',
      crop: b.crop,
      qty: `${Number(b.quantity).toFixed(2)} Q`,
      status: statusMap[b.status] || b.status,
      bookingId: b.booking_id,
      bookingStatus: b.status,
    };
  }));

  res.json({
    success: true,
    currentTokenNum: qRow?.current_token_num || 0,
    records,
  });
}));

router.get('/kpis', asyncHandler(async (req, res) => {
  const centreId = req.query.centreId || 'KR-PHK-01';
  const today = new Date().toISOString().slice(0, 10);
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('centre_id', centreId)
    .eq('date_iso', today)
    .not('status', 'eq', 'cancelled');

  const list = bookings || [];
  const done = list.filter((b) => ['payment-completed', 'procurement-completed', 'payment-initiated'].includes(b.status)).length;
  const active = list.filter((b) => ['processing', 'in-queue', 'checked-in'].includes(b.status)).length;
  const waiting = list.filter((b) => b.status === 'confirmed').length;
  const procured = list.reduce((sum, b) => sum + Number(b.actual_quantity || (['processing', 'procurement-completed', 'payment-initiated', 'payment-completed'].includes(b.status) ? b.quantity : 0)), 0);
  const paid = list.filter((b) => b.status === 'payment-completed').reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

  res.json({
    success: true,
    kpis: {
      arrivals: list.length,
      done,
      active,
      waiting,
      procuredQ: Math.round(procured),
      disbursed: paid,
    },
  });
}));

export default router;
