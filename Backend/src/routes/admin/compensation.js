import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { requireRole } from '../../middleware/requireRole.js';
import { logAction } from '../../lib/audit.js';

const router = Router();
router.use(requireAdmin);
router.use(requireRole('national_admin', 'regional_admin', 'centre_manager'));

/**
 * GET /api/admin/compensation
 * Paginated compensation claims with filters.
 * Query params: status, profileId, page, limit
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('compensation_claims')
    .select(`
      id, claim_number, profile_id, crop, damage_type, incident_date,
      affected_area_acres, status, approved_amount, created_at, updated_at,
      profiles (name, mobile, district, state)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.profileId) query = query.eq('profile_id', req.query.profileId);

  const { data, error, count } = await query;
  if (error) throw error;

  res.json({
    success: true,
    claims: data || [],
    pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
  });
}));

/**
 * GET /api/admin/compensation/:id
 * Full claim detail including documents and status history.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { data: claim, error } = await supabase
    .from('compensation_claims')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) throw error;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const [{ data: docs }, { data: history }, { data: farmer }] = await Promise.all([
    supabase.from('compensation_documents').select('*').eq('claim_id', claim.id).order('uploaded_at'),
    supabase.from('compensation_status_history').select('*').eq('claim_id', claim.id).order('created_at'),
    supabase.from('profiles').select('id, name, mobile, state, district, village, farmer_id').eq('id', claim.profile_id).maybeSingle(),
  ]);

  res.json({ success: true, claim, documents: docs || [], statusHistory: history || [], farmer });
}));

/**
 * PATCH /api/admin/compensation/:id/status
 * Change claim status and optionally add admin notes.
 * Body: { status, notes }
 */
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status, notes } = req.body || {};
  const VALID_STATUSES = [
    'submitted', 'document_verification', 'info_required', 'field_verification',
    'assessment', 'approved', 'partially_approved', 'rejected', 'payment_processing', 'paid',
  ];
  if (!VALID_STATUSES.includes(status)) throw new HttpError(400, 'invalid_status');

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status, profile_id, claim_number')
    .eq('id', req.params.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const { data: updated, error: updateErr } = await supabase
    .from('compensation_claims')
    .update({
      status,
      admin_notes: notes || null,
      reviewed_by: req.admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', claim.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  // Record status history
  await supabase.from('compensation_status_history').insert({
    claim_id: claim.id,
    from_status: claim.status,
    to_status: status,
    changed_by: req.admin.id,
    notes: notes || null,
  });

  // Notify farmer
  await supabase.from('notifications').insert({
    profile_id: claim.profile_id,
    category: 'compensation',
    text: `Your compensation claim ${claim.claim_number} status has been updated to: ${status.replace(/_/g, ' ')}.`,
  });

  logAction({
    actorId: req.admin.id,
    actorRole: req.admin.role,
    action: 'COMPENSATION_STATUS_CHANGED',
    entityType: 'compensation_claim',
    entityId: claim.id,
    metadata: { from: claim.status, to: status },
    ipAddress: req.ip,
  });

  res.json({ success: true, claim: updated });
}));

/**
 * POST /api/admin/compensation/:id/approve
 * Approve a claim with a specific amount.
 * Body: { approvedAmount, notes }
 */
router.post('/:id/approve', asyncHandler(async (req, res) => {
  const approvedAmount = Number(req.body?.approvedAmount);
  if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
    throw new HttpError(400, 'invalid_approved_amount');
  }

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status, profile_id, claim_number')
    .eq('id', req.params.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const { data: updated, error: updateErr } = await supabase
    .from('compensation_claims')
    .update({
      status: 'approved',
      approved_amount: approvedAmount,
      admin_notes: req.body?.notes || null,
      reviewed_by: req.admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', claim.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  await supabase.from('compensation_status_history').insert({
    claim_id: claim.id,
    from_status: claim.status,
    to_status: 'approved',
    changed_by: req.admin.id,
    notes: req.body?.notes || null,
  });

  await supabase.from('notifications').insert({
    profile_id: claim.profile_id,
    category: 'compensation',
    text: `Your compensation claim ${claim.claim_number} has been approved for Rs. ${approvedAmount.toLocaleString('en-IN')}.`,
  });

  logAction({
    actorId: req.admin.id,
    actorRole: req.admin.role,
    action: 'COMPENSATION_APPROVED',
    entityType: 'compensation_claim',
    entityId: claim.id,
    metadata: { approvedAmount },
    ipAddress: req.ip,
  });

  res.json({ success: true, claim: updated });
}));

export default router;
