import { verifyAccessToken } from '../lib/tokens.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'auth_required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'auth_required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    // Attach identity derived from the signed token — never from the request body.
    req.user = {
      id: decoded.id,
      mobile: decoded.mobile,
      name: decoded.name || '',
      role: decoded.role || 'farmer',
    };
    return next();
  } catch (err) {
    const expired = err && err.name === 'TokenExpiredError';
    return res.status(401).json({ success: false, error: expired ? 'token_expired' : 'invalid_token' });
  }
}

export default requireAuth;