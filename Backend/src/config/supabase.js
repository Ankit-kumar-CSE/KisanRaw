import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { createDemoDb } from '../lib/demoDb.js';

function isServiceRoleKey(key) {
  // Supabase keys are JWTs whose payload declares their role. Only the
  // service_role secret bypasses RLS for server-side writes; an anon key
  // silently fails every insert/update, so we refuse it outright.
  try {
    const payload = JSON.parse(Buffer.from(String(key).split('.')[1], 'base64').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

const serviceKey = env.supabaseServiceRoleKey;
export const usingDemoDb = !(env.supabaseUrl && serviceKey && isServiceRoleKey(serviceKey));

export const supabase = usingDemoDb
  ? createDemoDb()
  : createClient(env.supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
