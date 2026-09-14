import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { mapCentre } from '../lib/mappers.js';
import { ensureSlots, slotPayload, dayAvailability } from '../lib/slots.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('centres').select('*').order('distance_km');
  if (error) throw error;
  res.json({ success: true, centres: (data || []).map(mapCentre) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('centres').select('*').eq('id', req.params.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'centre_not_found');
  res.json({ success: true, centre: mapCentre(data) });
}));

router.get('/:id/slots', asyncHandler(async (req, res) => {
  const dateISO = req.query.date;
  if (!dateISO) throw new HttpError(400, 'date_required');
  const { data: templates, error: tErr } = await supabase.from('slot_templates').select('*').order('sort_order');
  if (tErr) throw tErr;
  const rows = await ensureSlots(req.params.id, dateISO);
  const byId = Object.fromEntries((templates || []).map((t) => [t.id, t]));
  const slots = (templates || []).map((t) => {
    const row = rows.find((r) => r.slot_id === t.id);
    return slotPayload(row || { slot_id: t.id, capacity: t.capacity, booked_count: 0, status: 'available' }, byId[t.id]);
  });
  res.json({ success: true, slots });
}));

router.get('/:id/availability', asyncHandler(async (req, res) => {
  const dateISO = req.query.date;
  if (!dateISO) throw new HttpError(400, 'date_required');
  const status = await dayAvailability(req.params.id, dateISO);
  res.json({ success: true, status });
}));

export default router;
