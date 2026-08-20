// server/routes/webhook.js
// POST /api/webhook/events — receiver for n8n-forwarded GoHighLevel / AI-agent
// events (spec §4.2/§4.8). Validates the normalized envelope and persists it
// through the EventStore interface (never talks to an adapter directly).
import { Router } from 'express';
import crypto from 'node:crypto';

export function webhookRouter({ store, config }) {
  const router = Router();

  router.post('/api/webhook/events', async (req, res) => {
    try {
      // Optional auth (§4.2): only enforced when GHL_WEBHOOK_SECRET is set.
      if (config.webhookSecret) {
        const provided = req.get('x-webhook-secret') || '';
        const a = Buffer.from(provided, 'utf8');
        const b = Buffer.from(config.webhookSecret, 'utf8');
        const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
        if (!ok) {
          return res.status(401).json({ error: 'invalid or missing x-webhook-secret header' });
        }
      }

      const body = req.body ?? {};
      const { event_type, client_id, timestamp, payload } = body;

      // Validation — fail loud with 400 + JSON error.
      if (typeof event_type !== 'string' || event_type.trim() === '') {
        return res.status(400).json({ error: 'event_type is required' });
      }
      if (typeof client_id !== 'string' || client_id.trim() === '') {
        return res.status(400).json({ error: 'client_id is required' });
      }
      if (timestamp !== undefined && timestamp !== null) {
        if (typeof timestamp !== 'string' || Number.isNaN(Date.parse(timestamp))) {
          // Decision (documented per §4.2): reject invalid timestamps, don't silently accept.
          return res.status(400).json({ error: 'timestamp must be ISO 8601' });
        }
      }
      // payload is optional; defaults to {} and is stored as-is (never flattened/renamed).
      const normalizedPayload = payload === undefined || payload === null ? {} : payload;
      if (typeof normalizedPayload !== 'object' || Array.isArray(normalizedPayload)) {
        return res.status(400).json({ error: 'payload must be an object' });
      }

      const record = await store.events.saveEvent({
        event_type,
        client_id,
        timestamp: timestamp ?? undefined,
        payload: normalizedPayload,
      });
      res.status(201).json({ record });
    } catch (err) {
      console.error('[webhook] persist failed:', err);
      res.status(500).json({ error: 'failed to persist event' });
    }
  });

  return router;
}
