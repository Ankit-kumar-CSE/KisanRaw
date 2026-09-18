import crypto from 'crypto';
import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { signAccessToken } from '../lib/tokens.js';
import { mapProfile } from '../lib/mappers.js';
import { env } from '../config/env.js';

const router = Router();

// OTPs live in memory — demo/hackathon scope. Swap for a table or SMS provider later.
const otpStore = new Map(); // mobile -> { code, expiresAt, attempts }

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function normalizeMobile(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function validMobile(m) {
  return /^[6-9]\d{9}$/.test(m);
}

function sessionFor(profile) {
  return {
    profileId: profile.id,
    mobile: profile.mobile,
    name: profile.name || '',
    role: profile.role || 'farmer',
  };
}

async function findOrCreateProfile(mobile) {
  const { data: existing, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('mobile', mobile)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: cErr } = await supabase
    .from('profiles')
    .insert({ mobile, role: 'farmer', name: '', crops: [] })
    .select('*')
    .single();
  if (cErr) throw cErr;
  return created;
}

router.post('/otp/send', asyncHandler(async (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  if (!validMobile(mobile)) throw new HttpError(400, 'invalid_mobile');

  const code = env.otpDemoMode
    ? env.otpDemoCode
    : String(crypto.randomInt(100000, 999999));

  otpStore.set(mobile, { code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });

  res.json({
    success: true,
    sent: true,
    ttlSeconds: OTP_TTL_MS / 1000,
    // Demo mode returns the OTP so judges can log in without SMS.
    ...(env.otpDemoMode ? { demoOtp: code } : {}),
  });
}));

router.post('/otp/verify', asyncHandler(async (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  const otp = String(req.body?.otp || '').trim();
  if (!validMobile(mobile) || otp.length !== 6) throw new HttpError(400, 'invalid_input');

  const record = otpStore.get(mobile);
  if (!record || record.expiresAt < Date.now()) {
    otpStore.delete(mobile);
    throw new HttpError(401, 'expired');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(mobile);
    throw new HttpError(429, 'too_many_attempts');
  }
  if (record.code !== otp) {
    record.attempts += 1;
    throw new HttpError(401, 'invalid_otp');
  }
  otpStore.delete(mobile);

  const profile = await findOrCreateProfile(mobile);
  const token = signAccessToken({
    id: profile.id,
    mobile: profile.mobile,
    name: profile.name || '',
    role: profile.role || 'farmer',
  });

  res.json({ success: true, token, session: sessionFor(profile), profile: mapProfile(profile) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new HttpError(404, 'profile_not_found');
  res.json({ success: true, session: sessionFor(profile), profile: mapProfile(profile) });
}));

router.post('/logout', requireAuth, asyncHandler(async (_req, res) => {
  res.json({ success: true });
}));

export default router;
