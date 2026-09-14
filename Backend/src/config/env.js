import dotenv from 'dotenv';

dotenv.config();

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing ${key}. Set it in Backend/.env`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5001,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS) || 60,
  otpDemoMode: String(process.env.OTP_DEMO_MODE || 'true') !== 'false',
  otpDemoCode: process.env.OTP_DEMO_CODE || '123456',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
