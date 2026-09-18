import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { usingDemoDb } from './src/config/supabase.js';
import { errorHandler } from './src/lib/http.js';
import authRoutes from './src/routes/auth.js';
import centreRoutes from './src/routes/centres.js';
import bookingRoutes from './src/routes/bookings.js';
import profileRoutes from './src/routes/profile.js';
import queueRoutes from './src/routes/queue.js';
import paymentRoutes from './src/routes/payments.js';
import notificationRoutes from './src/routes/notifications.js';
import operatorRoutes from './src/routes/operator.js';

const app = express();
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','), credentials: true }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'KishanSetu API', message: 'Backend is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/operator', operatorRoutes);

// Unknown routes → JSON 404 instead of the default HTML error page.
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'route_not_found' });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`KishanSetu API running on http://localhost:${env.port}`);
  console.log(usingDemoDb
    ? '[db] SUPABASE_SERVICE_ROLE_KEY not set — using in-memory demo data'
    : '[db] Using Supabase');
});
