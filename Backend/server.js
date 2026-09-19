import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './src/config/env.js';
import { usingDemoDb } from './src/config/supabase.js';
import { errorHandler } from './src/lib/http.js';

// ── Farmer routes ────────────────────────────────────────────────────────────
import authRoutes from './src/routes/auth.js';
import centreRoutes from './src/routes/centres.js';
import bookingRoutes from './src/routes/bookings.js';
import profileRoutes from './src/routes/profile.js';
import queueRoutes from './src/routes/queue.js';
import paymentRoutes from './src/routes/payments.js';
import notificationRoutes from './src/routes/notifications.js';
import operatorRoutes from './src/routes/operator.js';
import farmerCompensationRoutes from './src/routes/farmer/compensation.js';
import farmerSustainabilityRoutes from './src/routes/farmer/sustainability.js';

// ── Admin routes ─────────────────────────────────────────────────────────────
import adminAuthRoutes from './src/routes/admin/auth.js';
import adminDashboardRoutes from './src/routes/admin/dashboard.js';
import adminCompensationRoutes from './src/routes/admin/compensation.js';
import adminSustainabilityRoutes from './src/routes/admin/sustainability.js';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
  credentials: true,
}));

// ── Body parsing with size limit ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on OTP send — prevents brute-force / SMS flooding
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 5,                    // 5 OTP sends per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'too_many_otp_requests' },
});
app.use('/api/auth/otp/send', otpLimiter);

// General API rate limit — prevents abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'rate_limit_exceeded' },
});
app.use('/api', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'KisanRaw API', version: '2.0.0' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    mode: usingDemoDb ? 'demo' : 'production',
  });
});

// ── Farmer API routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/compensation', farmerCompensationRoutes);
app.use('/api/sustainability', farmerSustainabilityRoutes);

// ── Admin API routes ──────────────────────────────────────────────────────────
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin/compensation', adminCompensationRoutes);
app.use('/api/admin/sustainability', adminSustainabilityRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'route_not_found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`\nKisanRaw API v2.0 running on http://localhost:${env.port}`);
  console.log(usingDemoDb
    ? '[db] DEMO MODE — using in-memory data (set SUPABASE_SERVICE_ROLE_KEY for production)'
    : '[db] Connected to Supabase PostgreSQL');
  console.log('[routes] Farmer: /api/auth, /api/centres, /api/bookings, /api/queue, /api/payments, /api/notifications, /api/operator, /api/compensation, /api/sustainability');
  console.log('[routes] Admin:  /api/admin/auth, /api/admin/dashboard, /api/admin/compensation, /api/admin/sustainability\n');
});
