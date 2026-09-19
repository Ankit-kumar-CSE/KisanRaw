import { Router } from 'express';
import { supabase } from '../../config/supabase.js';
import { asyncHandler, HttpError } from '../../lib/http.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();
router.use(requireAdmin);

/**
 * Helper: build a centre_id filter array scoped to the admin's access.
 * - national_admin: all centres
 * - regional_admin: only centres in their region
 * - centre_manager / centre_operator: only their assigned centre
 */
async function getScopedCentreIds(admin) {
  if (admin.role === 'national_admin') return null; // null means "all"

  if (admin.role === 'regional_admin') {
    const { data, error } = await supabase
      .from('centres')
      .select('id')
      .eq('region_id', admin.regionId);
    if (error) throw error;
    return (data || []).map((c) => c.id);
  }

  // centre_manager / centre_operator
  if (admin.centreId) return [admin.centreId];
  return [];
}

/**
 * GET /api/admin/dashboard
 * Aggregated KPIs for the national dashboard / regional overview.
 */
router.get('/dashboard',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const centreIds = await getScopedCentreIds(req.admin);
    const today = new Date().toISOString().slice(0, 10);

    // Build queries scoped to allowed centres
    let bookingQuery = supabase.from('bookings').select('id, status, total_amount, centre_id');
    let profileCount = supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'farmer');
    let centreQuery = supabase.from('centres').select('id, name, status, total_storage_qtl, used_storage_qtl');

    if (centreIds !== null) {
      bookingQuery = bookingQuery.in('centre_id', centreIds);
      centreQuery = centreQuery.in('id', centreIds);
    }

    const todayBookingQuery = centreIds !== null
      ? supabase.from('bookings').select('id, status, quantity, actual_quantity, total_amount').eq('date_iso', today).in('centre_id', centreIds)
      : supabase.from('bookings').select('id, status, quantity, actual_quantity, total_amount').eq('date_iso', today);

    const [
      { data: allBookings },
      { count: totalFarmers },
      { data: centres },
      { data: todayBookings },
    ] = await Promise.all([
      bookingQuery,
      profileCount,
      centreQuery,
      todayBookingQuery,
    ]);

    const bList = allBookings || [];
    const tList = todayBookings || [];
    const cList = centres || [];

    const totalStorage = cList.reduce((s, c) => s + Number(c.total_storage_qtl || 0), 0);
    const usedStorage = cList.reduce((s, c) => s + Number(c.used_storage_qtl || 0), 0);

    const todayProcured = tList
      .filter((b) => ['procurement-completed', 'payment-initiated', 'payment-completed'].includes(b.status))
      .reduce((s, b) => s + Number(b.actual_quantity || b.quantity || 0), 0);

    const pendingPayments = bList
      .filter((b) => b.status === 'procurement-completed' || b.status === 'payment-initiated')
      .reduce((s, b) => s + Number(b.total_amount || 0), 0);

    const totalDisbursed = bList
      .filter((b) => b.status === 'payment-completed')
      .reduce((s, b) => s + Number(b.total_amount || 0), 0);

    res.json({
      success: true,
      kpis: {
        totalFarmers: totalFarmers || 0,
        totalCentres: cList.length,
        activeCentres: cList.filter((c) => c.status === 'open').length,
        todayBookings: tList.length,
        todayProcuredQ: Math.round(todayProcured),
        totalStorageQ: Math.round(totalStorage),
        usedStorageQ: Math.round(usedStorage),
        availableStorageQ: Math.round(totalStorage - usedStorage),
        pendingPaymentsAmount: Math.round(pendingPayments),
        totalDisbursedAmount: Math.round(totalDisbursed),
      },
    });
  })
);

/**
 * GET /api/admin/centres
 * List centres scoped to the admin's access.
 */
router.get('/centres',
  requireRole('national_admin', 'regional_admin', 'centre_manager', 'centre_operator'),
  asyncHandler(async (req, res) => {
    const centreIds = await getScopedCentreIds(req.admin);
    let query = supabase.from('centres').select('*').order('name');
    if (centreIds !== null) query = query.in('id', centreIds);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, centres: data || [] });
  })
);

/**
 * GET /api/admin/bookings
 * Paginated bookings with filters.
 * Query params: centreId, date, status, crop, page (default 1), limit (default 20)
 */
router.get('/bookings',
  requireRole('national_admin', 'regional_admin', 'centre_manager', 'centre_operator'),
  asyncHandler(async (req, res) => {
    const centreIds = await getScopedCentreIds(req.admin);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (centreIds !== null) query = query.in('centre_id', centreIds);
    if (req.query.centreId) query = query.eq('centre_id', req.query.centreId);
    if (req.query.date) query = query.eq('date_iso', req.query.date);
    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.crop) query = query.eq('crop', req.query.crop);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      bookings: data || [],
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  })
);

/**
 * GET /api/admin/farmers
 * Paginated farmer list with optional filters.
 * Query params: state, district, search, page, limit
 */
router.get('/farmers',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('role', 'farmer')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.state) query = query.eq('state', req.query.state);
    if (req.query.district) query = query.eq('district', req.query.district);

    const { data, error, count } = await query;
    if (error) throw error;

    // Exclude sensitive fields before returning
    const farmers = (data || []).map(({ password_hash, ...f }) => f);

    res.json({
      success: true,
      farmers,
      pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / limit) },
    });
  })
);

/**
 * GET /api/admin/farmers/:id
 * Farmer detail with recent bookings.
 */
router.get('/farmers/:id',
  requireRole('national_admin', 'regional_admin', 'centre_manager', 'centre_operator'),
  asyncHandler(async (req, res) => {
    const { data: farmer, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!farmer) throw new HttpError(404, 'farmer_not_found');

    const { data: bookings } = await supabase
      .from('bookings')
      .select('booking_id, centre_name, crop, quantity, status, date_iso, created_at')
      .eq('profile_id', farmer.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ success: true, farmer, recentBookings: bookings || [] });
  })
);

/**
 * GET /api/admin/analytics
 * Aggregated procurement + payment analytics per centre.
 * Query params: date (defaults to today), centreId (optional filter)
 */
router.get('/analytics',
  requireRole('national_admin', 'regional_admin', 'centre_manager'),
  asyncHandler(async (req, res) => {
    const centreIds = await getScopedCentreIds(req.admin);
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    let query = supabase
      .from('bookings')
      .select('centre_id, centre_name, status, quantity, actual_quantity, total_amount, crop')
      .eq('date_iso', date);

    if (centreIds !== null) query = query.in('centre_id', centreIds);
    if (req.query.centreId) query = query.eq('centre_id', req.query.centreId);

    const { data: bookings, error } = await query;
    if (error) throw error;

    const list = bookings || [];

    // Group by centre
    const bycentre = {};
    for (const b of list) {
      if (!bycentre[b.centre_id]) {
        bycentre[b.centre_id] = { centreId: b.centre_id, centreName: b.centre_name, bookings: 0, procuredQ: 0, paidAmount: 0, crops: {} };
      }
      const c = bycentre[b.centre_id];
      c.bookings++;
      if (['procurement-completed', 'payment-initiated', 'payment-completed'].includes(b.status)) {
        c.procuredQ += Number(b.actual_quantity || b.quantity || 0);
      }
      if (b.status === 'payment-completed') {
        c.paidAmount += Number(b.total_amount || 0);
      }
      c.crops[b.crop] = (c.crops[b.crop] || 0) + 1;
    }

    // Overall crop breakdown
    const cropBreakdown = {};
    for (const b of list) {
      if (['procurement-completed', 'payment-initiated', 'payment-completed'].includes(b.status)) {
        cropBreakdown[b.crop] = (cropBreakdown[b.crop] || 0) + Number(b.actual_quantity || b.quantity || 0);
      }
    }

    res.json({
      success: true,
      date,
      centreBreakdown: Object.values(bycentre),
      cropBreakdown,
      totals: {
        bookings: list.length,
        procuredQ: Math.round(Object.values(bycentre).reduce((s, c) => s + c.procuredQ, 0)),
        paidAmount: Math.round(Object.values(bycentre).reduce((s, c) => s + c.paidAmount, 0)),
      },
    });
  })
);

export default router;
