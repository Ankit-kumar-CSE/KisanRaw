import { supabase } from '../config/supabase.js';

/**
 * Write an immutable audit log entry.
 * Fire-and-forget — errors are logged but not re-thrown so they never
 * block the primary request.
 *
 * @param {{
 *   actorId: string,
 *   actorRole: string,
 *   action: string,
 *   entityType?: string,
 *   entityId?: string,
 *   metadata?: object,
 *   ipAddress?: string
 * }} entry
 */
export async function logAction({ actorId, actorRole, action, entityType, entityId, metadata, ipAddress }) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType || null,
      entity_id: entityId ? String(entityId) : null,
      metadata: metadata || null,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    // Audit log failure must never break the user-facing flow.
    console.error('[audit] Failed to write audit log:', err.message);
  }
}
