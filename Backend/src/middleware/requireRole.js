/**
 * Role-based access control middleware factory.
 * Must be used AFTER requireAdmin — it reads req.admin which requireAdmin sets.
 *
 * Usage:
 *   router.get('/secret', requireAdmin, requireRole('national_admin'), handler)
 *   router.get('/regional', requireAdmin, requireRole('regional_admin', 'national_admin'), handler)
 *
 * @param {...string} allowedRoles  One or more allowed role strings
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, error: 'admin_auth_required' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'insufficient_role',
        required: allowedRoles,
        actual: req.admin.role,
      });
    }
    return next();
  };
}

export default requireRole;
