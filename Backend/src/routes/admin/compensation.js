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
 * Regional admins see only claims from centres in their region.
 * Query params: status, profileId, crop, damageType, page, limit
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  // Build scoped centre filter
  let centreIds = null;
  if (req.admin.role === 'regional_admin' && req.admin.regionId) {
    const { data: regionCentres } = await supabase
      .from('centres').select('id').eq('region_id', req.admin.regionId);
    centreIds = (regionCentres || []).map((c) => c.id);
  } else if (req.admin.role === 'centre_manager' && req.admin.centreId) {
    centreIds = [req.admin.centreId];
  }

  let query = supabase
    .from('compensation_claims')
    .select(`
      id, claim_number, profile_id, crop, damage_type, incident_date,
      affected_area_acres, status, approved_amount, created_at, updated_at, centre_id,
      profiles (name, mobile, district, state)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (centreIds !== null) query = query.in('centre_id', centreIds);
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.profileId) query = query.eq('profile_id', req.query.profileId);
  if (req.query.crop) query = query.eq('crop', req.query.crop);
  if (req.query.damageType) query = query.eq('damage_type', req.query.damageType);

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

/**
 * POST /api/admin/compensation/:id/request-info
 * Request additional information from the farmer.
 * Body: { reason }
 */
router.post('/:id/request-info', asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) throw new HttpError(400, 'reason_required');

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status, profile_id, claim_number')
    .eq('id', req.params.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const { data: updated, error: updateErr } = await supabase
    .from('compensation_claims')
    .update({ status: 'info_required', admin_notes: reason, reviewed_by: req.admin.id, updated_at: new Date().toISOString() })
    .eq('id', claim.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  await supabase.from('compensation_status_history').insert({
    claim_id: claim.id, from_status: claim.status, to_status: 'info_required',
    changed_by: req.admin.id, notes: reason,
  });

  await supabase.from('notifications').insert({
    profile_id: claim.profile_id, category: 'compensation',
    text: `Additional information is required for your claim ${claim.claim_number}: ${reason}`,
  });

  logAction({ actorId: req.admin.id, actorRole: req.admin.role, action: 'COMPENSATION_INFO_REQUESTED',
    entityType: 'compensation_claim', entityId: claim.id, metadata: { reason }, ipAddress: req.ip });

  res.json({ success: true, claim: updated });
}));

/**
 * POST /api/admin/compensation/:id/reject
 * Reject a compensation claim.
 * Body: { reason }
 */
router.post('/:id/reject', asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) throw new HttpError(400, 'reason_required');

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status, profile_id, claim_number')
    .eq('id', req.params.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const { data: updated, error: updateErr } = await supabase
    .from('compensation_claims')
    .update({ status: 'rejected', admin_notes: reason, reviewed_by: req.admin.id, updated_at: new Date().toISOString() })
    .eq('id', claim.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  await supabase.from('compensation_status_history').insert({
    claim_id: claim.id, from_status: claim.status, to_status: 'rejected',
    changed_by: req.admin.id, notes: reason,
  });

  await supabase.from('notifications').insert({
    profile_id: claim.profile_id, category: 'compensation',
    text: `Your compensation claim ${claim.claim_number} has been rejected. Reason: ${reason}`,
  });

  logAction({ actorId: req.admin.id, actorRole: req.admin.role, action: 'COMPENSATION_REJECTED',
    entityType: 'compensation_claim', entityId: claim.id, metadata: { reason }, ipAddress: req.ip });

  res.json({ success: true, claim: updated });
}));

/**
 * GET /api/admin/compensation/analytics
 * Aggregate KPIs — scoped to the admin's access level.
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  let centreIds = null;
  if (req.admin.role === 'regional_admin' && req.admin.regionId) {
    const { data: regionCentres } = await supabase
      .from('centres').select('id').eq('region_id', req.admin.regionId);
    centreIds = (regionCentres || []).map((c) => c.id);
  } else if (req.admin.role === 'centre_manager' && req.admin.centreId) {
    centreIds = [req.admin.centreId];
  }

  let query = supabase.from('compensation_claims').select('status, approved_amount');
  if (centreIds !== null) query = query.in('centre_id', centreIds);

  const { data: claims, error } = await query;
  if (error) throw error;

  const list = claims || [];
  const total = list.length;
  const pending = list.filter((c) => ['submitted', 'document_verification', 'field_verification', 'assessment'].includes(c.status)).length;
  const infoRequired = list.filter((c) => c.status === 'info_required').length;
  const approved = list.filter((c) => ['approved', 'partially_approved'].includes(c.status)).length;
  const rejected = list.filter((c) => c.status === 'rejected').length;
  const paid = list.filter((c) => c.status === 'paid').length;
  const totalApprovedAmount = list
    .filter((c) => c.approved_amount)
    .reduce((s, c) => s + Number(c.approved_amount), 0);

  res.json({ success: true, analytics: { total, pending, infoRequired, approved, rejected, paid, totalApprovedAmount: Math.round(totalApprovedAmount) } });
}));

export default router;
