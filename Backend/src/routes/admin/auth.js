import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { verifyPassword, signAdminToken } from '../../lib/adminAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { logAction } from '../../lib/audit.js';

const router = Router();

/**
 * POST /api/admin/auth/login
 * Body: { email, password }
 * Returns: { success, token, admin }
 */
router.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) throw new HttpError(400, 'email_and_password_required');

  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash, name, role, centre_id, region_id, active')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;

  // Use the same error message for missing account and wrong password
  // to prevent account enumeration.
  if (!adminUser || !adminUser.active) {
    throw new HttpError(401, 'invalid_credentials');
  }

  const passwordOk = await verifyPassword(password, adminUser.password_hash);
  if (!passwordOk) {
    throw new HttpError(401, 'invalid_credentials');
  }

  const token = signAdminToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    centreId: adminUser.centre_id,
    regionId: adminUser.region_id,
  });

  logAction({
    actorId: adminUser.id,
    actorRole: adminUser.role,
    action: 'ADMIN_LOGIN',
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    token,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      centreId: adminUser.centre_id,
      regionId: adminUser.region_id,
    },
  });
}));

/**
 * GET /api/admin/auth/me
 * Refresh session — returns the admin profile from DB using the verified token.
 */
router.get('/me', requireAdmin, asyncHandler(async (req, res) => {
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id, email, name, role, centre_id, region_id, active')
    .eq('id', req.admin.id)
    .maybeSingle();

  if (error) throw error;
  if (!adminUser || !adminUser.active) throw new HttpError(401, 'admin_not_found');

  res.json({
    success: true,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      centreId: adminUser.centre_id,
      regionId: adminUser.region_id,
    },
  });
}));

export default router;
