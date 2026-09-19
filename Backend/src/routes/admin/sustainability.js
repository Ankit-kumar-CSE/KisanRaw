import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { requireRole } from '../../middleware/requireRole.js';
import { logAction } from '../../lib/audit.js';

const router = Router();
router.use(requireAdmin);

/**
 * GET /api/admin/sustainability/goals
 * List all sustainability goals (including inactive for admin).
 */
router.get('/goals',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('sustainability_goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, goals: data || [] });
  })
);

/**
 * POST /api/admin/sustainability/goals
 * Create a new sustainability goal.
 * Body: { title, description, criteria, benefit_description }
 */
router.post('/goals',
  requireRole('national_admin'),
  asyncHandler(async (req, res) => {
    const { title, description, criteria, benefit_description } = req.body || {};
    if (!title || !criteria) throw new HttpError(400, 'title_and_criteria_required');

    const { data, error } = await supabase
      .from('sustainability_goals')
      .insert({ title, description: description || null, criteria, benefit_description: benefit_description || null })
      .select('*')
      .single();
    if (error) throw error;

    logAction({
      actorId: req.admin.id,
      actorRole: req.admin.role,
      action: 'SUSTAINABILITY_GOAL_CREATED',
      entityType: 'sustainability_goal',
      entityId: data.id,
      metadata: { title },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, goal: data });
  })
);

/**
 * GET /api/admin/sustainability/submissions
 * Paginated submissions with filters.
 * Query params: status, goalId, page, limit
 */
router.get('/submissions',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sustainability_submissions')
      .select(`
        id, profile_id, goal_id, status, score_awarded, benefit_awarded,
        submitted_at, reviewed_at, created_at,
        profiles (name, mobile, district, state),
        sustainability_goals (title)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.goalId) query = query.eq('goal_id', req.query.goalId);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      submissions: data || [],
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  })
);

/**
 * PATCH /api/admin/sustainability/submissions/:id/review
 * Verify, reject, or request additional evidence for a submission.
 * Body: { status, notes, score_awarded, benefit_awarded }
 */
router.patch('/submissions/:id/review',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const { status, notes, score_awarded, benefit_awarded } = req.body || {};
    const VALID = ['under_review', 'additional_evidence_required', 'verified', 'rejected'];
    if (!VALID.includes(status)) throw new HttpError(400, 'invalid_status');

    const { data: sub, error: fetchErr } = await supabase
      .from('sustainability_submissions')
      .select('id, status, profile_id, goal_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!sub) throw new HttpError(404, 'submission_not_found');

    const patch = {
      status,
      notes: notes || null,
      reviewed_by: req.admin.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Only apply score/benefit when verifying
    if (status === 'verified') {
      patch.score_awarded = Number(score_awarded) || 0;
      patch.benefit_awarded = benefit_awarded || null;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('sustainability_submissions')
      .update(patch)
      .eq('id', sub.id)
      .select('*')
      .single();
    if (updateErr) throw updateErr;

    // Notify farmer
    const statusMsg = status === 'verified'
      ? `Your sustainability submission has been verified! Score awarded: ${patch.score_awarded}.`
      : status === 'additional_evidence_required'
      ? 'Additional evidence is required for your sustainability submission. Please check the app for details.'
      : `Your sustainability submission status has been updated to: ${status}.`;

    await supabase.from('notifications').insert({
      profile_id: sub.profile_id,
      category: 'sustainability',
      text: statusMsg,
    });

    logAction({
      actorId: req.admin.id,
      actorRole: req.admin.role,
      action: 'SUSTAINABILITY_SUBMISSION_REVIEWED',
      entityType: 'sustainability_submission',
      entityId: sub.id,
      metadata: { status, score_awarded: patch.score_awarded },
      ipAddress: req.ip,
    });

    res.json({ success: true, submission: updated });
  })
);

/**
 * GET /api/admin/sustainability/submissions/:id
 * Full submission detail with evidence list and goal info.
 */
router.get('/submissions/:id',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const { data: sub, error } = await supabase
      .from('sustainability_submissions')
      .select(`
        *, sustainability_goals (id, title, description, criteria, required_evidence, optional_evidence, benefit_description, score_points, benefit_type),
        profiles (id, name, mobile, district, state, village, farmer_id)
      `)
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!sub) throw new HttpError(404, 'submission_not_found');

    const { data: evidence } = await supabase
      .from('sustainability_evidence')
      .select('*')
      .eq('submission_id', sub.id)
      .order('uploaded_at');

    res.json({ success: true, submission: sub, evidence: evidence || [] });
  })
);

/**
 * PATCH /api/admin/sustainability/goals/:id
 * Edit or toggle active status of a sustainability goal.
 * Body: { title?, description?, criteria?, benefit_description?, score_points?, benefit_type?,
 *         required_evidence?, optional_evidence?, active? }
 * Restricted to national_admin.
 */
router.patch('/goals/:id',
  requireRole('national_admin'),
  asyncHandler(async (req, res) => {
    const allowed = ['title', 'description', 'criteria', 'benefit_description', 'score_points',
      'benefit_type', 'required_evidence', 'optional_evidence', 'active'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (!Object.keys(patch).length) throw new HttpError(400, 'no_fields_to_update');

    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('sustainability_goals')
      .update(patch)
      .eq('id', req.params.id)
      .select('*')
      .single();
    if (error) throw error;

    logAction({
      actorId: req.admin.id, actorRole: req.admin.role,
      action: 'SUSTAINABILITY_GOAL_UPDATED', entityType: 'sustainability_goal',
      entityId: data.id, metadata: patch, ipAddress: req.ip,
    });

    res.json({ success: true, goal: data });
  })
);

/**
 * GET /api/admin/sustainability/analytics
 * Participation stats, goal completion counts, and score distribution.
 */
router.get('/analytics',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const [{ data: submissions }, { data: goals }] = await Promise.all([
      supabase.from('sustainability_submissions').select('status, score_awarded, goal_id'),
      supabase.from('sustainability_goals').select('id, title, score_points, active'),
    ]);

    const list = submissions || [];
    const total = list.length;
    const verified = list.filter((s) => s.status === 'verified').length;
    const pending = list.filter((s) => ['submitted', 'under_review'].includes(s.status)).length;
    const rejected = list.filter((s) => s.status === 'rejected').length;
    const totalScoreAwarded = list.reduce((s, sub) => s + Number(sub.score_awarded || 0), 0);

    // Per-goal completion counts
    const goalStats = (goals || []).map((g) => {
      const subs = list.filter((s) => s.goal_id === g.id);
      return {
        goalId: g.id, title: g.title, scorePoints: g.score_points, active: g.active,
        total: subs.length, verified: subs.filter((s) => s.status === 'verified').length,
      };
    });

    res.json({ success: true, analytics: { total, verified, pending, rejected, totalScoreAwarded }, goalStats });
  })
);

export default router;
