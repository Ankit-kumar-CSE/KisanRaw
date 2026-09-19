import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { env } from './env.js';
import { createDemoDb } from '../lib/demoDb.js';

// Polyfill WebSocket for Node.js < 22.
// @supabase/realtime-js requires a native WebSocket; Node 20 doesn't have one.
// Providing the `ws` package satisfies the requirement without upgrading Node.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WebSocket;
}

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
      realtime: {
        transport: WebSocket,
      },
    });
