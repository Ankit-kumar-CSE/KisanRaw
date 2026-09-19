import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually (dotenvx is a CLI tool, not an importable module)
const __dir = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(resolve(__dir, '../.env'), 'utf8');
for (const line of envText.split('\n')) {
  const [k, ...rest] = line.split('=');
  if (k && !k.startsWith('#') && rest.length) {
    process.env[k.trim()] = rest.join('=').trim();
  }
}

if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Generate the hash fresh so it matches this machine's bcryptjs
const password = 'Admin@1234';
const hash = await bcrypt.hash(password, 12);
console.log('Generated hash:', hash);

// Verify it works locally before pushing
const ok = await bcrypt.compare(password, hash);
console.log('Self-verify:', ok ? '✓ PASS' : '✗ FAIL');

const emails = [
  'national@kisanraw.gov.in',
  'regional.punjab@kisanraw.gov.in',
  'manager.phagwara@kisanraw.gov.in',
  'operator.phagwara@kisanraw.gov.in',
];

const { data, error } = await supabase
  .from('admin_users')
  .update({ password_hash: hash })
  .in('email', emails)
  .select('email, role');

if (error) {
  console.error('Supabase error:', error.message);
  process.exit(1);
}

console.log('Updated accounts:', JSON.stringify(data, null, 2));
console.log('\n✅ Password hashes updated. Login with Admin@1234.');
