// server/routes/events.js
// GET /api/events, GET /api/kpis, GET /api/trend, GET /api/top-leads (spec §4.8).
import { Router } from 'express';
import {
  TIMEFRAMES,
  resolveWindow,
  computeKpis,
  dailyBookingBuckets,
  topLeads,
} from '../kpis.js';

function badTimeframe(res, timeframe) {
  return res.status(400).json({ error: `timeframe must be one of: ${TIMEFRAMES.join(', ')} (got "${timeframe}")` });
}

export function eventsRouter({ store }) {
  const router = Router();

  // GET /api/events?eventType=&timeframe=&clientId=  — rows for tabs, newest first
  router.get('/api/events', async (req, res) => {
    try {
      const { eventType, timeframe, clientId } = req.query;
      const filter = { clientId: clientId || undefined };
      if (timeframe) {
        if (!TIMEFRAMES.includes(timeframe)) return badTimeframe(res, timeframe);
        const win = resolveWindow(timeframe);
        filter.from = win.from.toISOString();
        filter.to = win.to.toISOString();
      }
      if (eventType) filter.eventTypes = [eventType];
      const rows = await store.events.listEvents(filter);
      rows.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
      res.json(rows);
    } catch (err) {
      console.error('[events] failed:', err);
      res.status(500).json({ error: 'failed to load events' });
    }
  });

  // GET /api/kpis?timeframe=  — { current, previous, changes } per §4.8
  router.get('/api/kpis', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'today';
      if (!TIMEFRAMES.includes(timeframe)) return badTimeframe(res, timeframe);
      const data = await computeKpis(store, timeframe);
      res.json(data);
    } catch (err) {
      console.error('[kpis] failed:', err);
      res.status(500).json({ error: 'failed to compute KPIs' });
    }
  });

  // GET /api/trend?timeframe=  — daily buckets of booking_made
  router.get('/api/trend', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'this_week';
      if (!TIMEFRAMES.includes(timeframe)) return badTimeframe(res, timeframe);
      const win = resolveWindow(timeframe);
      const events = await store.events.listEvents({
        eventTypes: ['booking_made'],
        from: win.from.toISOString(),
        to: win.to.toISOString(),
      });
      res.json({ timeframe, buckets: dailyBookingBuckets(events, timeframe) });
    } catch (err) {
      console.error('[trend] failed:', err);
      res.status(500).json({ error: 'failed to compute trend' });
    }
  });

  // GET /api/top-leads?timeframe=&limit=5  — §4.9 algorithm
  router.get('/api/top-leads', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'today';
      if (!TIMEFRAMES.includes(timeframe)) return badTimeframe(res, timeframe);
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '5', 10) || 5, 1), 20);
      const win = resolveWindow(timeframe);
      const events = await store.events.listEvents({
        from: win.from.toISOString(),
        to: win.to.toISOString(),
      });
      res.json({ timeframe, leads: topLeads(events, limit) });
    } catch (err) {
      console.error('[top-leads] failed:', err);
      res.status(500).json({ error: 'failed to compute top leads' });
    }
  });

  return router;
}
