import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Admin token expires in 8 hours (one working shift)
const ADMIN_TOKEN_TTL = '8h';

/**
 * Hash a plaintext password with bcrypt.
 * @param {string} password
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign an admin JWT.
 * Payload includes only what is needed for RBAC — never includes the password hash.
 * @param {{ id: string, email: string, role: string, centreId: string|null, regionId: string|null }} payload
 * @returns {string}
 */
export function signAdminToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      centreId: payload.centreId || null,
      regionId: payload.regionId || null,
    },
    env.adminJwtSecret,
    { expiresIn: ADMIN_TOKEN_TTL }
  );
}

/**
 * Verify an admin JWT and return its decoded payload.
 * Throws if invalid or expired.
 * @param {string} token
 * @returns {{ id: string, email: string, role: string, centreId: string|null, regionId: string|null }}
 */
export function verifyAdminToken(token) {
  return jwt.verify(token, env.adminJwtSecret);
}
