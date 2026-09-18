import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Full booking lifecycle, in the order a booking advances.
export const STAGES = [
  'confirmed',
  'checked-in',
  'in-queue',
  'processing',
  'procurement-completed',
  'payment-initiated',
  'payment-completed',
];

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// Human-friendly booking id, e.g. KS-20260918-A241-X8K4
export function bookingIdFor(dateISO, tokenNum) {
  const compact = String(dateISO).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let rand = '';
  while (rand.length < 4) {
    rand += alphabet[crypto.randomBytes(1)[0] % alphabet.length];
  }
  return `KS-${compact}-A${String(tokenNum).padStart(3, '0')}-${rand}`;
}
