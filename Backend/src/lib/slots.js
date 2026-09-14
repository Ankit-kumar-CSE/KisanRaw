import { supabase } from '../config/supabase.js';

function seedOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function deriveStatus(seed, i) {
  const roll = (seed >> (i * 3)) % 10;
  if (roll < 2) return 'full';
  if (roll < 4) return 'limited';
  if (roll < 9) return 'available';
  return 'closed';
}

export async function ensureSlots(centreId, dateISO) {
  const { data: templates, error: tErr } = await supabase
    .from('slot_templates')
    .select('*')
    .order('sort_order');
  if (tErr) throw tErr;

  const { data: existing, error: eErr } = await supabase
    .from('centre_slot_days')
    .select('*')
    .eq('centre_id', centreId)
    .eq('date', dateISO);
  if (eErr) throw eErr;

  if (existing?.length >= templates.length) return existing;

  const seed = seedOf(`${centreId}:${dateISO}`);
  const rows = templates.map((tpl, i) => {
    const status = deriveStatus(seed, i);
    return {
      centre_id: centreId,
      date: dateISO,
      slot_id: tpl.id,
      capacity: tpl.capacity,
      booked_count: 0,
      status,
    };
  });

  const { data, error } = await supabase
    .from('centre_slot_days')
    .upsert(rows, { onConflict: 'centre_id,date,slot_id' })
    .select();
  if (error) throw error;
  return data;
}

export function slotPayload(row, template) {
  const remaining = Math.max(0, row.capacity - row.booked_count);
  let status = row.status;
  if (status !== 'closed' && remaining <= 0) status = 'full';
  else if (status !== 'closed' && remaining <= 10) status = 'limited';
  return {
    id: row.slot_id,
    label: template?.label || row.slot_id,
    status,
    qAvailable: status === 'full' || status === 'closed' ? 0 : remaining,
  };
}

export async function dayAvailability(centreId, dateISO) {
  const rows = await ensureSlots(centreId, dateISO);
  if (rows.every((r) => r.status === 'full' || r.status === 'closed' || r.booked_count >= r.capacity)) {
    return 'full';
  }
  if (rows.some((r) => r.status === 'limited' || r.capacity - r.booked_count <= 10)) return 'limited';
  return 'available';
}
