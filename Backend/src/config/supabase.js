import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
