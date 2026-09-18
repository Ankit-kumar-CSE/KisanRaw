import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { mapProfile } from '../lib/mappers.js';

const router = Router();
router.use(requireAuth);

const ALLOWED = [
  'name', 'farmer_id', 'state', 'district', 'village', 'address',
  'crops', 'aadhaar_last4', 'bank_name', 'bank_last4', 'ifsc', 'vehicle',
];

// Accept both camelCase (from the app) and snake_case keys.
const ALIASES = {
  farmerId: 'farmer_id',
  aadhaarLast4: 'aadhaar_last4',
  bankName: 'bank_name',
  bankLast4: 'bank_last4',
};

router.get('/', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'profile_not_found');
  res.json({ success: true, profile: mapProfile(data) });
}));

router.put('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const patch = { updated_at: new Date().toISOString() };

  for (const [key, value] of Object.entries(body)) {
    const column = ALIASES[key] || key;
    if (ALLOWED.includes(column)) patch[column] = value;
  }
  if (Array.isArray(patch.crops)) patch.crops = patch.crops.map(String);

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (error) throw error;
  res.json({ success: true, profile: mapProfile(data) });
}));

export default router;
