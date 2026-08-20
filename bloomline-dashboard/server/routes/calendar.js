// server/routes/calendar.js
// GET /api/calendar?month=YYYY-MM — bookings for the Calendar tab month view
// (spec §4.8). Derived from events where event_type = 'booking_made' within the
// server-local month window (§4.7); newest first.
import { Router } from 'express';

export function calendarRouter({ store }) {
  const router = Router();

  router.get('/api/calendar', async (req, res) => {
    try {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const month = typeof req.query.month === 'string' && req.query.month !== '' ? req.query.month : defaultMonth;

      if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: 'month must be in YYYY-MM format' });
      }
      const [y, m] = month.split('-').map(Number);
      if (m < 1 || m > 12) {
        return res.status(400).json({ error: 'month must be in YYYY-MM format' });
      }
      const from = new Date(y, m - 1, 1); // local midnight, 1st of month
      const to = new Date(y, m, 1); // local midnight, 1st of next month

      const events = await store.events.listEvents({
        eventTypes: ['booking_made'],
        from: from.toISOString(),
        to: to.toISOString(),
      });

      const bookings = events.map((e) => ({
        event_id: e.id,
        date_time: e.timestamp,
        lead_name:
          e.payload && typeof e.payload.lead_name === 'string' && e.payload.lead_name.trim()
            ? e.payload.lead_name.trim()
            : null,
        client_id: e.client_id,
        channel: e.payload && typeof e.payload.channel === 'string' ? e.payload.channel : null,
        status: e.payload && typeof e.payload.status === 'string' ? e.payload.status : null,
      }));
      bookings.sort((a, b) => Date.parse(b.date_time) - Date.parse(a.date_time));

      res.json({ month, bookings });
    } catch (err) {
      console.error('[calendar] failed:', err);
      res.status(500).json({ error: 'failed to load calendar' });
    }
  });

  return router;
}
