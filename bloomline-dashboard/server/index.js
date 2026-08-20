// server/index.js
// Express backend + webhook receiver (spec §6.2). Frontend proxies /api -> :4001.
import 'dotenv/config';
import express from 'express';
import { resolveConfig } from './config.js';
import { createStore } from './store.js';
import { webhookRouter } from './routes/webhook.js';
import { eventsRouter } from './routes/events.js';
import { calendarRouter } from './routes/calendar.js';
import { usersRouter } from './routes/users.js';

// resolveConfig() throws per the §4.5 matrix (e.g. SUPABASE_URL set, key empty)
// — the server refuses to start rather than falling back silently.
const config = resolveConfig();
const store = createStore(config);

// §4.5 loud banner (local-file mode) — explicit, never silent.
if (config.mode === 'local-file') {
  console.log('⚠️  DEV MODE: local store — Supabase not configured (SUPABASE_URL is empty in .env)');
  console.log('⚠️  All events and users are persisted to ./data/*.json until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.');
} else {
  console.log('Supabase mode: events and users persisted to Supabase.');
}

// §4.2 — unset GHL_WEBHOOK_SECRET is a known dev-scope state: warn loudly.
if (!config.webhookSecret) {
  console.warn('⚠️  GHL_WEBHOOK_SECRET is unset — webhook receiver accepts unauthenticated POSTs (dev scope only).');
}

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mode: config.mode });
});

app.use(webhookRouter({ store, config }));
app.use(eventsRouter({ store }));
app.use(calendarRouter({ store }));
app.use(usersRouter({ store }));

// JSON error handler — every failure returns JSON { error }, never an HTML page (spec §4.8).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' });
  }
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'internal server error' });
});

const port = config.webhookPort;
app.listen(port, () => {
  console.log(`[bloomline-dashboard] backend + webhook receiver listening on http://localhost:${port}`);
  console.log('[bloomline-dashboard] POST /api/webhook/events  |  GET /api/health  |  GET /api/kpis  |  GET /api/events  |  GET /api/trend  |  GET /api/top-leads  |  GET /api/calendar  |  GET+POST /api/users');
});
