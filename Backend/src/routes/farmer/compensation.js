import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { logAction } from '../../lib/audit.js';

const router = Router();
router.use(requireAuth);

// Only farmers can access compensation routes
function ensureFarmer(req) {
  if (req.user.role !== 'farmer') throw new HttpError(403, 'farmers_only');
}

function generateClaimNumber(dateISO) {
  const year = dateISO.slice(0, 4);
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CR-${year}-${rand}`;
}

/**
 * GET /api/compensation/claims
 * Returns all compensation claims belonging to the authenticated farmer.
 */
router.get('/claims', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data, error } = await supabase
    .from('compensation_claims')
    .select('id, claim_number, crop, damage_type, incident_date, affected_area_acres, status, approved_amount, created_at, updated_at')
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  res.json({ success: true, claims: data || [] });
}));

/**
 * POST /api/compensation/claims
 * Create a new compensation claim (in draft status).
 * Body: { crop, cropVariety?, sowingDate?, harvestDate?, cultivatedAreaAcres?,
 *         damageType, otherDamageType?, incidentDate, damagePct?,
 *         affectedAreaAcres, estimatedLossQtl?, description?,
 *         village?, district?, state?, lat?, lng?, centreId? }
 */
router.post('/claims', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const {
    crop, cropVariety, sowingDate, harvestDate, cultivatedAreaAcres,
    damageType, otherDamageType, incidentDate, damagePct,
    affectedAreaAcres, estimatedLossQtl, description,
    village, district, state, lat, lng, centreId,
  } = req.body || {};

  if (!crop || !damageType || !incidentDate || !affectedAreaAcres) {
    throw new HttpError(400, 'missing_required_fields');
  }

  const acres = Number(affectedAreaAcres);
  if (!Number.isFinite(acres) || acres <= 0 || acres > 10000) {
    throw new HttpError(400, 'invalid_affected_area');
  }

  const claimNumber = generateClaimNumber(new Date().toISOString().slice(0, 10));

  const { data, error } = await supabase
    .from('compensation_claims')
    .insert({
      claim_number: claimNumber,
      profile_id: req.user.id,
      crop,
      crop_variety: cropVariety || null,
      sowing_date: sowingDate || null,
      harvest_date: harvestDate || null,
      cultivated_area_acres: cultivatedAreaAcres ? Number(cultivatedAreaAcres) : null,
      damage_type: damageType,
      other_damage_type: damageType === 'other' ? (otherDamageType || null) : null,
      incident_date: incidentDate,
      damage_pct: damagePct ? Number(damagePct) : null,
      affected_area_acres: acres,
      estimated_loss_qtl: estimatedLossQtl ? Number(estimatedLossQtl) : null,
      description: description || null,
      village: village || null,
      district: district || null,
      state: state || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      centre_id: centreId || null,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;

  logAction({
    actorId: req.user.id,
    actorRole: 'farmer',
    action: 'COMPENSATION_CLAIM_CREATED',
    entityType: 'compensation_claim',
    entityId: data.id,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, claim: data });
}));

/**
 * POST /api/compensation/upload-url
 * Generate a signed Supabase Storage upload URL for a compensation document.
 * The path is always constructed by the backend — never trusted from client.
 * Body: { claimId, fileName, fileType, fileSizeBytes }
 */
router.post('/upload-url', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { claimId, fileName, fileType, fileSizeBytes } = req.body || {};
  if (!claimId || !fileName || !fileType || !fileSizeBytes) {
    throw new HttpError(400, 'missing_upload_fields');
  }

  // Verify ownership
  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status')
    .eq('id', claimId)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');
  if (['approved', 'rejected', 'paid'].includes(claim.status)) {
    throw new HttpError(400, 'claim_is_closed');
  }

  const { validateUploadRequest, createUploadUrl } = await import('../lib/supabaseStorage.js');
  const { ext } = validateUploadRequest({ fileName, fileType, fileSizeBytes });

  const path = `compensation/${claimId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { signedUrl } = await createUploadUrl(path);

  res.json({ success: true, signedUrl, filePath: path });
}));

/**
 * GET /api/compensation/claims/:id
 * Returns claim detail including documents and status history.
 * Enforces ownership — farmers can only see their own claims.
 */
router.get('/claims/:id', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: claim, error } = await supabase
    .from('compensation_claims')
    .select('*')
    .eq('id', req.params.id)
    .eq('profile_id', req.user.id)  // ownership check
    .maybeSingle();
  if (error) throw error;
  if (!claim) throw new HttpError(404, 'claim_not_found');

  const [{ data: docs }, { data: history }] = await Promise.all([
    supabase.from('compensation_documents').select('id, file_name, file_type, file_size_bytes, uploaded_at').eq('claim_id', claim.id),
    supabase.from('compensation_status_history').select('from_status, to_status, notes, created_at').eq('claim_id', claim.id).order('created_at'),
  ]);

  res.json({ success: true, claim, documents: docs || [], statusHistory: history || [] });
}));

/**
 * POST /api/compensation/claims/:id/documents
 * Record metadata for an already-uploaded document (file goes directly to Supabase Storage).
 * Body: { fileName, fileType, fileSizeBytes, filePath }
 */
router.post('/claims/:id/documents', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');
  if (claim.status === 'approved' || claim.status === 'rejected' || claim.status === 'paid') {
    throw new HttpError(400, 'claim_is_closed');
  }

  const { fileName, fileType, fileSizeBytes, filePath } = req.body || {};
  if (!fileName || !fileType || !fileSizeBytes || !filePath) {
    throw new HttpError(400, 'missing_document_fields');
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!ALLOWED_TYPES.includes(fileType)) throw new HttpError(400, 'invalid_file_type');
  if (Number(fileSizeBytes) > 10 * 1024 * 1024) throw new HttpError(400, 'file_too_large');

  const { data, error } = await supabase
    .from('compensation_documents')
    .insert({
      claim_id: claim.id,
      file_name: String(fileName).slice(0, 200),
      file_path: filePath,
      file_type: fileType,
      file_size_bytes: Number(fileSizeBytes),
    })
    .select('*')
    .single();
  if (error) throw error;

  res.status(201).json({ success: true, document: data });
}));

/**
 * POST /api/compensation/claims/:id/submit
 * Move a claim from draft -> submitted.
 */
router.post('/claims/:id/submit', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: claim, error: fetchErr } = await supabase
    .from('compensation_claims')
    .select('id, status, claim_number')
    .eq('id', req.params.id)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!claim) throw new HttpError(404, 'claim_not_found');
  if (claim.status !== 'draft' && claim.status !== 'info_required') {
    throw new HttpError(400, 'claim_already_submitted');
  }

  const { data: updated, error: updateErr } = await supabase
    .from('compensation_claims')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', claim.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  await supabase.from('compensation_status_history').insert({
    claim_id: claim.id,
    from_status: claim.status,
    to_status: 'submitted',
    changed_by: req.user.id,
  });

  await supabase.from('notifications').insert({
    profile_id: req.user.id,
    category: 'compensation',
    text: `Your compensation claim ${claim.claim_number} has been submitted and is under review.`,
  });

  logAction({
    actorId: req.user.id,
    actorRole: 'farmer',
    action: 'COMPENSATION_CLAIM_SUBMITTED',
    entityType: 'compensation_claim',
    entityId: claim.id,
    ipAddress: req.ip,
  });

  res.json({ success: true, claim: updated });
}));

export default router;
