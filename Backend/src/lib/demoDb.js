// In-memory Supabase-compatible fallback so the API runs with zero external
// dependencies (hackathon demo). Implements the subset of the PostgREST query
// builder used by the routes: select/eq/neq/in/not/or/order/limit, thenable,
// maybeSingle/single, insert/update/upsert with optional .select().
//
// When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured, the real
// Supabase client is used instead and this module is never mounted.

const nowISO = () => new Date().toISOString();

function seedTables() {
  return {
    profiles: [],
    // ── Admin users (demo mode — bcrypt hash of "Admin@1234" cost 12) ──────────
    admin_users: [
      {
        id: 'admin-national-01',
        email: 'national@kisanraw.gov.in',
        // bcrypt hash of "Admin@1234" — verified via bcryptjs
        password_hash: '$2b$12$Pl3Dt7Dq.X1EYvld.tPREuGLrL79Y0MqE08BeId9tIGEE7qeDdcqe',
        name: 'Dr. R.K. Swaminathan',
        role: 'national_admin',
        centre_id: null,
        region_id: null,
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'admin-regional-pb-01',
        email: 'regional.punjab@kisanraw.gov.in',
        password_hash: '$2b$12$Pl3Dt7Dq.X1EYvld.tPREuGLrL79Y0MqE08BeId9tIGEE7qeDdcqe',
        name: 'Amritpal Singh Dhaliwal',
        role: 'regional_admin',
        centre_id: null,
        region_id: 'region-pb-doaba',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'admin-manager-phk-01',
        email: 'manager.phagwara@kisanraw.gov.in',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhbe/R.NjIbznBnbRmGShy',
        name: 'Gurpreet Kaur Sandhu',
        role: 'centre_manager',
        centre_id: 'KR-PHK-01',
        region_id: null,
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'admin-operator-phk-01',
        email: 'operator.phagwara@kisanraw.gov.in',
        password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhbe/R.NjIbznBnbRmGShy',
        name: 'Harjinder Singh',
        role: 'centre_operator',
        centre_id: 'KR-PHK-01',
        region_id: null,
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    // ── Regions ────────────────────────────────────────────────────────────────
    regions: [
      { id: 'region-pb-doaba', name: 'Punjab — Doaba Zone', code: 'PB-DOABA', state: 'Punjab' },
      { id: 'region-pb-majha', name: 'Punjab — Majha Zone', code: 'PB-MAJHA', state: 'Punjab' },
    ],
    // ── Audit logs ─────────────────────────────────────────────────────────────
    audit_logs: [],
    // ── Compensation ───────────────────────────────────────────────────────────
    compensation_claims: [],
    compensation_documents: [],
    compensation_status_history: [],
    compensation_payments: [],
    // ── Sustainability ─────────────────────────────────────────────────────────
    sustainability_goals: [
      {
        id: 'goal-01',
        title: 'Zero Stubble Burning',
        description: 'Avoid burning crop residue after harvest.',
        criteria: 'Submit geo-tagged photo proof of field without fire damage after harvest season.',
        required_evidence: 'Geo-tagged photo of field after harvest showing no burn marks',
        optional_evidence: 'Video evidence, land records',
        benefit_description: 'Score: 50 pts + MSP bonus Rs. 100/Q on next procurement',
        score_points: 50,
        benefit_type: 'procurement_priority',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'goal-02',
        title: 'Organic Certification',
        description: 'Achieve NPOP/PGS-India organic certification for your farm.',
        criteria: 'Upload valid organic certificate issued within the last 3 years.',
        required_evidence: 'Valid NPOP or PGS-India organic certificate issued within last 3 years',
        optional_evidence: 'Field inspection report, input purchase records',
        benefit_description: 'Score: 100 pts + Premium MSP rate on eligible crops',
        score_points: 100,
        benefit_type: 'premium_rate',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'goal-03',
        title: 'Drip Irrigation Adoption',
        description: 'Install and use drip / micro-irrigation in place of flood irrigation.',
        criteria: 'Submit installation invoice + field photos showing drip system in use.',
        required_evidence: 'Installation invoice for drip/micro-irrigation system, field photos showing system in active use',
        optional_evidence: 'Water usage records before and after installation',
        benefit_description: 'Score: 75 pts + Govt. subsidy link assistance',
        score_points: 75,
        benefit_type: 'scheme_assistance',
        active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    sustainability_submissions: [],
    sustainability_evidence: [],
    sustainability_status_history: [],
    // ── Existing tables ────────────────────────────────────────────────────────
    centres: [
      {
        id: 'KR-PHK-01',
        name: 'Phagwara Main Mandi Centre',
        address: 'Grand Trunk Rd, Focal Point, Phagwara, Kapurthala',
        distance_km: 8.2,
        drive_mins: 14,
        waiting_farmers: 21,
        wait_mins: 18,
        free_pct: 61,
        hours: '08:00 AM – 06:00 PM',
        bays: 'Bay #1, #2 & #3 Active',
        crops: ['Wheat', 'Paddy', 'Maize'],
        status: 'open',
        recommended: true,
        map_x: 44,
        map_y: 30,
        region_id: 'region-pb-doaba',
        state: 'Punjab',
        district: 'Kapurthala',
        total_storage_qtl: 18000,
        used_storage_qtl: 14200,
      },
      {
        id: 'KR-PHK-02',
        name: 'Markfed Focal Point Centre',
        address: 'Focal Point Industrial Area, Phagwara',
        distance_km: 11.4,
        drive_mins: 21,
        waiting_farmers: 34,
        wait_mins: 35,
        free_pct: 38,
        hours: '08:00 AM – 05:00 PM',
        bays: 'Bay #1 & #2 Active',
        crops: ['Wheat', 'Paddy', 'Maize'],
        status: 'open',
        recommended: false,
        map_x: 64,
        map_y: 52,
        region_id: 'region-pb-doaba',
        state: 'Punjab',
        district: 'Kapurthala',
        total_storage_qtl: 12000,
        used_storage_qtl: 7440,
      },
      {
        id: 'KR-PHL-03',
        name: 'Patiala Road Yard',
        address: 'Patiala Road, Phagwara Outskirts',
        distance_km: 14.9,
        drive_mins: 26,
        waiting_farmers: 58,
        wait_mins: 65,
        free_pct: 12,
        hours: '08:00 AM – 04:00 PM',
        bays: 'Only Bay #1 Active',
        crops: ['Paddy'],
        status: 'busy',
        recommended: false,
        map_x: 24,
        map_y: 68,
        region_id: 'region-pb-doaba',
        state: 'Punjab',
        district: 'Kapurthala',
        total_storage_qtl: 8000,
        used_storage_qtl: 7040,
      },
      {
        id: 'KR-MHT-04',
        name: 'Mehtan Sub-Yard',
        address: 'Mehtan Village, Kapurthala',
        distance_km: 6.1,
        drive_mins: 12,
        waiting_farmers: 0,
        wait_mins: 0,
        free_pct: 0,
        hours: 'Closed for Rabi season',
        bays: '—',
        crops: [],
        status: 'closed',
        recommended: false,
        map_x: 74,
        map_y: 20,
        region_id: 'region-pb-doaba',
        state: 'Punjab',
        district: 'Kapurthala',
        total_storage_qtl: 5000,
        used_storage_qtl: 0,
      },
    ],
    slot_templates: [
      { id: 'slot-1', label: '06:00 AM – 09:00 AM', capacity: 60, sort_order: 1 },
      { id: 'slot-2', label: '09:00 AM – 12:00 PM', capacity: 60, sort_order: 2 },
      { id: 'slot-3', label: '12:00 PM – 03:00 PM', capacity: 50, sort_order: 3 },
      { id: 'slot-4', label: '03:00 PM – 06:00 PM', capacity: 40, sort_order: 4 },
    ],
    crop_rates: [
      { crop: 'Wheat', rate_per_qtl: 2275 },
      { crop: 'Paddy', rate_per_qtl: 2183 },
      { crop: 'Maize', rate_per_qtl: 2500 },
    ],
    centre_slot_days: [],
    bookings: [],
    notifications: [],
    centre_queues: [],
  };
}


function makeError(message) {
  return { message, status: 500 };
}

function filterRows(rows, state) {
  let out = rows.filter((r) => state.filters.every((f) => f(r)));

  for (const ord of state.orders) {
    const dir = ord.ascending === false ? -1 : 1;
    out = [...out].sort((a, b) => {
      const av = a[ord.column];
      const bv = b[ord.column];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : -dir;
    });
  }

  if (state.limit != null) out = out.slice(0, state.limit);
  return out;
}

function createQuery(table, state, exec) {
  // Filters/orders accumulate in place; every .from() starts a fresh state.
  const apply = (mutator) => {
    mutator(state);
    return createQuery(table, state, exec);
  };

  const chain = {
    select() {
      return chain;
    },
    eq(column, value) {
      return apply((s) => { s.filters.push((r) => r[column] === value); });
    },
    neq(column, value) {
      return apply((s) => { s.filters.push((r) => r[column] !== value); });
    },
    in(column, values) {
      return apply((s) => { s.filters.push((r) => (values || []).includes(r[column])); });
    },
    not(column, _op, value) {
      return apply((s) => { s.filters.push((r) => r[column] !== value); });
    },
    or(expr) {
      const clauses = String(expr)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const idx = c.indexOf('.eq.');
          if (idx < 0) return null;
          return { column: c.slice(0, idx), value: c.slice(idx + 4) };
        })
        .filter(Boolean);
      return apply((s) => {
        s.filters.push((r) => clauses.some((c) => r[c.column] === c.value));
      });
    },
    order(column, opts = {}) {
      return apply((s) => { s.orders.push({ column, ascending: opts.ascending !== false }); });
    },
    limit(n) {
      return apply((s) => { s.limit = n; });
    },
    update(patch) {
      return createMutation(table, state, exec, { type: 'update', patch });
    },
    upsert(rows, opts = {}) {
      return createMutation(table, state, exec, { type: 'upsert', rows: Array.isArray(rows) ? rows : [rows], onConflict: (opts.onConflict || '').split(',') });
    },
    insert(payload) {
      const rows = (Array.isArray(payload) ? payload : [payload]).map((r) => ({
        ...r,
        created_at: r.created_at || nowISO(),
      }));
      return createMutation(table, state, exec, { type: 'insert', rows });
    },
    maybeSingle: () => exec(table, state).then((rows) => ({ data: rows[0] || null, error: null })),
    single: () => exec(table, state).then((rows) => {
      if (!rows.length) return { data: null, error: makeError(`${table}: no rows found`) };
      return { data: rows[0], error: null };
    }),
    // Like supabase-js, a plain await resolves { data, error } — never a bare array.
    then: (resolve, reject) =>
      exec(table, state).then((rows) => resolve({ data: rows, error: null }), reject),
  };
  return chain;
}

function createMutation(table, state, exec, mutation) {
  const run = async () => {
    const db = exec.db;
    const rows = db[table];

    if (mutation.type === 'insert') {
      const created = mutation.rows.map((r, i) => ({ id: r.id || `${table}-${Date.now()}-${i}`, ...r }));
      rows.push(...created);
      return created;
    }

    const matching = filterRows(rows, state);

    if (mutation.type === 'update') {
      for (const row of matching) Object.assign(row, mutation.patch);
      return matching;
    }

    // upsert
    const keys = mutation.onConflict.filter(Boolean);
    const affected = [];
    for (const incoming of mutation.rows) {
      const match = keys.length
        ? rows.find((r) => keys.every((k) => r[k] === incoming[k]))
        : matching[0];
      if (match) {
        Object.assign(match, incoming);
        affected.push(match);
      } else {
        const created = { id: incoming.id || `${table}-${Date.now()}-${rows.length}`, ...incoming };
        rows.push(created);
        affected.push(created);
      }
    }
    return affected;
  };

  let selected = false;
  // supabase-js lets filters come after the verb (update().eq(...)); share the
  // same mutable state so they scope the rows this mutation affects.
  const chain = {
    select() {
      selected = true;
      return chain;
    },
    eq(column, value) {
      state.filters.push((r) => r[column] === value);
      return chain;
    },
    neq(column, value) {
      state.filters.push((r) => r[column] !== value);
      return chain;
    },
    in(column, values) {
      state.filters.push((r) => (values || []).includes(r[column]));
      return chain;
    },
    single: () => run().then((rows) => {
      if (!rows.length) return { data: null, error: makeError(`${table}: no rows affected`) };
      return { data: rows[0], error: null };
    }),
    then: (resolve, reject) =>
      run().then(
        (rows) => resolve({ data: selected ? rows : null, error: null }),
        reject,
      ),
  };
  return chain;
}

export function createDemoDb() {
  const db = seedTables();

  const exec = async (table, state) => {
    if (!(table in db)) throw makeError(`demo_db: unknown table "${table}"`);
    return filterRows(db[table], state);
  };
  exec.db = db;

  return {
    __demo: true,
    from: (table) => createQuery(table, { filters: [], orders: [], limit: null }, exec),
    // rpc: book_slot_atomic — atomically increment booked_count if under capacity
    rpc: (fnName, params) => {
      if (fnName === 'book_slot_atomic') {
        return Promise.resolve().then(() => {
          const slotDays = db['centre_slot_days'];
          const entry = slotDays.find(
            (s) => s.centre_id === params.p_centre_id &&
                   s.date === params.p_date &&
                   s.slot_id === params.p_slot_id
          );
          if (!entry) return { data: false, error: null };
          if (entry.booked_count >= entry.capacity) return { data: false, error: null };
          entry.booked_count = (entry.booked_count || 0) + 1;
          return { data: true, error: null };
        });
      }
      return Promise.resolve({ data: null, error: makeError(`demo_db: unknown rpc "${fnName}"`) });
    },
  };
}
