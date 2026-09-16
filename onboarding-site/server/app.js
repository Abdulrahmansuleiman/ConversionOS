// server/app.js
// Configures and exports the Express app (no listen) so the same app runs
// locally (server/index.js) and as a Vercel serverless function (api/index.js).
// This is the PUBLIC client onboarding site — no auth middleware.
import express from 'express';
import { buildRoutes } from './routes.js';
import { resolveConfig } from './config.js';

export function createApp() {
  const cfg = resolveConfig();
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      const { bot } = await import('./notion.js').then((m) => m.health());
      res.json({ ok: true, mode: 'notion', bot, configured: Boolean(cfg.notionToken) });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });

  app.use('/api', buildRoutes());

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));

  return app;
}