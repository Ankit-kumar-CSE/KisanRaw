import dotenv from 'dotenv';

dotenv.config();

const required = ['SUPABASE_URL', 'JWT_SECRET', 'ADMIN_JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}. Set it in Backend/.env`);
  }
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[env] SUPABASE_SERVICE_ROLE_KEY not set — backend will run in demo mode (in-memory data).');
}

export const env = {
  port: Number(process.env.PORT) || 5001,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Farmer JWT (OTP auth) — 30d expiry
  jwtSecret: process.env.JWT_SECRET || 'dev-only-farmer-secret-change-me',

  // Admin JWT (email+password auth) — 8h expiry
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'dev-only-admin-secret-change-me',

  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,

  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS) || 600,
  otpDemoMode: String(process.env.OTP_DEMO_MODE || 'true') !== 'false',
  otpDemoCode: process.env.OTP_DEMO_CODE || '123456',

  corsOrigin: process.env.CORS_ORIGIN || '*',
};
