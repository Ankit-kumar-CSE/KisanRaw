import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

function buildQueueWindow(myNum, cursor) {
  const start = Math.max(1, myNum - 9);
  const tokens = Array.from({ length: 12 }, (_, i) => `A-${start + i}`);
  const queue = tokens.map((t) => {
    const n = parseInt(t.slice(2), 10);
    return {
      token: t,
      state: n < cursor ? 'done' : n === cursor ? 'current' : 'waiting',
      isYou: n === myNum,
    };
  });
  const ahead = Math.max(0, myNum - cursor - 1);
  return { queue, ahead };
}

router.get('/', asyncHandler(async (req, res) => {
  const token = req.query.token;
  const centreId = req.query.centreId;
  if (!token) throw new HttpError(400, 'token_required');

  let bookingQuery = supabase
    .from('bookings')
    .select('*')
    .eq('profile_id', req.user.id)
    .eq('token', token)
    .in('status', ['confirmed', 'checked-in', 'in-queue', 'processing', 'procurement-completed', 'payment-initiated'])
    .order('created_at', { ascending: false })
    .limit(1);
  if (centreId) bookingQuery = bookingQuery.eq('centre_id', centreId);

  const { data: booking, error } = await bookingQuery.maybeSingle();
  if (error) throw error;
  if (!booking) throw new HttpError(404, 'booking_not_found');

  const myNum = booking.token_num;
  const { data: qRow } = await supabase
    .from('centre_queues')
    .select('*')
    .eq('centre_id', booking.centre_id)
    .maybeSingle();

  let cursor = qRow?.current_token_num ?? Math.max(myNum - 7, 1);
  if (cursor > myNum) cursor = myNum;
  if (!qRow) {
    await supabase.from('centre_queues').insert({ centre_id: booking.centre_id, current_token_num: cursor });
  }

  const { queue, ahead } = buildQueueWindow(myNum, cursor);
  const counter = 1 + (cursor % 3);

  res.json({
    success: true,
    myToken: token,
    currentToken: `A-${cursor}`,
    farmersAhead: ahead,
    yourTurn: ahead === 0,
    estWaitMins: Math.max(2, ahead * 4 + 2),
    counter,
    queue,
    lastUpdated: new Date().toISOString(),
    centreId: booking.centre_id,
  });
}));

export default router;
