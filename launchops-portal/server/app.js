// server/app.js
// Configures and exports the Express app (no listen) so the same app runs
// locally (server/index.js) and as a Vercel serverless function (api/index.js).
import express from 'express';
import { requireAuth, loginRouter } from './auth.js';
import { buildRoutes } from './routes.js';
import { resolveConfig } from './config.js';

export function createApp() {
  const cfg = resolveConfig();
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Cookie parsing (no external dep needed for a single cookie).
  app.use((req, _res, next) => {
    const header = req.headers.cookie || '';
    req.cookies = Object.fromEntries(
      header.split(';').map((c) => {
        const i = c.indexOf('=');
        return i === -1 ? [c.trim(), ''] : [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1).trim())];
      })
    );
    next();
  });

  app.get('/api/health', async (_req, res) => {
    try {
      const { bot } = await import('./notion.js').then((m) => m.health());
      res.json({ ok: true, mode: 'notion', bot, configured: Boolean(cfg.notionToken) });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });

  app.use('/api', loginRouter(express));
  app.use('/api', requireAuth, buildRoutes());

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));

  return app;
}