import { verifyAdminToken } from '../lib/adminAuth.js';

/**
 * Middleware that verifies the admin JWT from the Authorization header.
 * Attaches req.admin = { id, email, role, centreId, regionId } on success.
 *
 * This uses a DIFFERENT secret and token structure from requireAuth (farmer JWT).
 * A farmer token cannot be used to access admin routes and vice versa.
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'admin_auth_required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'admin_auth_required' });
  }

  try {
    const decoded = verifyAdminToken(token);
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      centreId: decoded.centreId || null,
      regionId: decoded.regionId || null,
    };
    return next();
  } catch (err) {
    const expired = err && err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: expired ? 'admin_token_expired' : 'invalid_admin_token',
    });
  }
}

export default requireAdmin;
