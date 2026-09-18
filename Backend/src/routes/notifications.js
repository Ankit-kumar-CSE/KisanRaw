import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { mapNotification } from '../lib/mappers.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  res.json({ success: true, notifications: (data || []).map(mapNotification) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) throw new HttpError(400, 'text_required');
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      profile_id: req.user.id,
      category: req.body.category || 'announcement',
      text,
    })
    .select('*')
    .single();
  if (error) throw error;
  const { data: all } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  res.status(201).json({ success: true, notification: mapNotification(data), notifications: (all || []).map(mapNotification) });
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', req.user.id)
    .eq('read', false);
  if (error) throw error;
  const { data: all } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  res.json({ success: true, notifications: (all || []).map(mapNotification) });
}));

export default router;
