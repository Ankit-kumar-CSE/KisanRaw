import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { logAction } from '../../lib/audit.js';

const router = Router();
router.use(requireAuth);

function ensureFarmer(req) {
  if (req.user.role !== 'farmer') throw new HttpError(403, 'farmers_only');
}

/**
 * GET /api/sustainability/goals
 * List active sustainability goals visible to all farmers.
 */
router.get('/goals', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sustainability_goals')
    .select('id, title, description, criteria, benefit_description')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  res.json({ success: true, goals: data || [] });
}));

/**
 * GET /api/sustainability/profile
 * Returns the farmer's own submissions and aggregate score.
 */
router.get('/profile', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: submissions, error } = await supabase
    .from('sustainability_submissions')
    .select(`
      id, goal_id, status, score_awarded, benefit_awarded,
      submitted_at, reviewed_at, created_at, updated_at,
      sustainability_goals (title, benefit_description)
    `)
    .eq('profile_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const list = submissions || [];
  const totalScore = list
    .filter((s) => s.status === 'verified')
    .reduce((sum, s) => sum + Number(s.score_awarded || 0), 0);

  res.json({ success: true, submissions: list, totalScore });
}));

/**
 * POST /api/sustainability/submissions
 * Start a new sustainability submission for a goal.
 * Body: { goalId }
 */
router.post('/submissions', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { goalId } = req.body || {};
  if (!goalId) throw new HttpError(400, 'goal_id_required');

  // Verify goal exists and is active
  const { data: goal, error: gErr } = await supabase
    .from('sustainability_goals')
    .select('id, title, active')
    .eq('id', goalId)
    .maybeSingle();
  if (gErr) throw gErr;
  if (!goal || !goal.active) throw new HttpError(404, 'goal_not_found');

  // Check for existing non-expired submission for the same goal
  const { data: existing } = await supabase
    .from('sustainability_submissions')
    .select('id, status')
    .eq('profile_id', req.user.id)
    .eq('goal_id', goalId)
    .in('status', ['draft', 'submitted', 'under_review', 'additional_evidence_required'])
    .maybeSingle();

  if (existing) throw new HttpError(409, 'submission_already_active');

  const { data, error } = await supabase
    .from('sustainability_submissions')
    .insert({
      profile_id: req.user.id,
      goal_id: goalId,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;

  res.status(201).json({ success: true, submission: data });
}));

/**
 * POST /api/sustainability/submissions/:id/evidence
 * Record metadata for an already-uploaded evidence file.
 * Body: { fileName, fileType, fileSizeBytes, filePath }
 */
router.post('/submissions/:id/evidence', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: sub, error: fetchErr } = await supabase
    .from('sustainability_submissions')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!sub) throw new HttpError(404, 'submission_not_found');
  if (['verified', 'rejected', 'expired'].includes(sub.status)) {
    throw new HttpError(400, 'submission_is_closed');
  }

  const { fileName, fileType, fileSizeBytes, filePath } = req.body || {};
  if (!fileName || !fileType || !fileSizeBytes || !filePath) {
    throw new HttpError(400, 'missing_evidence_fields');
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!ALLOWED_TYPES.includes(fileType)) throw new HttpError(400, 'invalid_file_type');
  if (Number(fileSizeBytes) > 10 * 1024 * 1024) throw new HttpError(400, 'file_too_large');

  const { data, error } = await supabase
    .from('sustainability_evidence')
    .insert({
      submission_id: sub.id,
      file_name: String(fileName).slice(0, 200),
      file_path: filePath,
      file_type: fileType,
      file_size_bytes: Number(fileSizeBytes),
    })
    .select('*')
    .single();
  if (error) throw error;

  res.status(201).json({ success: true, evidence: data });
}));

/**
 * POST /api/sustainability/submissions/:id/submit
 * Move a draft submission to submitted state.
 */
router.post('/submissions/:id/submit', asyncHandler(async (req, res) => {
  ensureFarmer(req);

  const { data: sub, error: fetchErr } = await supabase
    .from('sustainability_submissions')
    .select('id, status, goal_id')
    .eq('id', req.params.id)
    .eq('profile_id', req.user.id)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!sub) throw new HttpError(404, 'submission_not_found');
  if (sub.status !== 'draft' && sub.status !== 'additional_evidence_required') {
    throw new HttpError(400, 'submission_already_submitted');
  }

  // Require at least one piece of evidence before submitting
  const { count: evidenceCount } = await supabase
    .from('sustainability_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('submission_id', sub.id);

  if (!evidenceCount || evidenceCount < 1) {
    throw new HttpError(400, 'evidence_required_before_submit');
  }

  const { data: updated, error: updateErr } = await supabase
    .from('sustainability_submissions')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id)
    .select('*')
    .single();
  if (updateErr) throw updateErr;

  await supabase.from('notifications').insert({
    profile_id: req.user.id,
    category: 'sustainability',
    text: 'Your sustainability submission has been received and is under review.',
  });

  logAction({
    actorId: req.user.id,
    actorRole: 'farmer',
    action: 'SUSTAINABILITY_SUBMISSION_SUBMITTED',
    entityType: 'sustainability_submission',
    entityId: sub.id,
    ipAddress: req.ip,
  });

  res.json({ success: true, submission: updated });
}));

export default router;
