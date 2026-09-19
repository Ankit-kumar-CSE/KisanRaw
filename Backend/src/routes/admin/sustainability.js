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

export default router;
