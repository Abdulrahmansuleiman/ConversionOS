// server/kpis.js
// Pure functions: timeframe resolution (§4.7), KPI counts, trend math, top-leads
// ranking (§4.9). No I/O here — routes pass in already-fetched events.
//
// Timeframe semantics (canonical, §4.7) — windows resolved in the server's LOCAL
// timezone; stored timestamps stay ISO-8601 UTC. `last_*` windows are rolling.
//
//   today          local midnight -> now
//   this_week      Monday 00:00 local -> now
//   last_week      now - 7 days -> now (rolling)
//   last_month     now - 30 days -> now (rolling)
//   last_2_months  now - 60 days -> now (rolling)

export const TIMEFRAMES = ['today', 'this_week', 'last_week', 'last_month', 'last_2_months'];

export const TIMEFRAME_LABELS = {
  today: 'Today',
  this_week: 'This Week',
  last_week: 'Last Week',
  last_month: 'Last Month',
  last_2_months: 'Last 2 Months',
};

// KPI cards (spec §4.7). Order defines the display order in the 3+2 grid.
export const KPI_DEFS = [
  { key: 'bookings', eventType: 'booking_made', label: 'Bookings' },
  { key: 'humanTransfers', eventType: 'handed_off_to_human', label: 'Human Transfers' },
  { key: 'totalConversations', eventType: 'conversation_started', label: 'Total Conversations' },
  { key: 'followUps', eventType: 'follow_up_triggered', label: 'Follow-ups' },
  { key: 'leadsQualified', eventType: 'lead_qualified', label: 'Leads Qualified' },
];

export function resolveWindow(timeframe, now = new Date()) {
  const to = now;
  let from;
  switch (timeframe) {
    case 'today':
      from = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      break;
    case 'this_week': {
      const daysSinceMonday = (to.getDay() + 6) % 7; // getDay(): 0=Sun .. 6=Sat
      from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - daysSinceMonday);
      break;
    }
    case 'last_week':
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last_month':
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last_2_months':
      from = new Date(to.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    default:
      throw new Error(`Unknown timeframe: ${timeframe}`);
  }
  return { from, to, lengthMs: to.getTime() - from.getTime() };
}

function countAll(events) {
  const counts = {
    bookings: 0,
    humanTransfers: 0,
    totalConversations: 0,
    followUps: 0,
    leadsQualified: 0,
  };
  for (const e of events) {
    if (e.event_type === 'booking_made') counts.bookings += 1;
    else if (e.event_type === 'handed_off_to_human') counts.humanTransfers += 1;
    else if (e.event_type === 'conversation_started') counts.totalConversations += 1;
    else if (e.event_type === 'follow_up_triggered') counts.followUps += 1;
    else if (e.event_type === 'lead_qualified') counts.leadsQualified += 1;
  }
  return counts;
}

// Trend math per §4.7:
//   prev=0, cur=0           -> change 0%, neutral
//   prev=0, cur>0           -> +100% with label 'new'
//   prev>0                  -> round((cur - prev) / prev * 100)%
function changeFor(cur, prev) {
  if (prev === 0 && cur === 0) return { pct: 0, label: 'neutral' };
  if (prev === 0 && cur > 0) return { pct: 100, label: 'new' };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { pct: 0, label: 'neutral' };
  return { pct, label: pct > 0 ? 'up' : 'down' };
}

export async function computeKpis(store, timeframe, now = new Date()) {
  const win = resolveWindow(timeframe, now);
  const prevStart = new Date(win.from.getTime() - win.lengthMs);
  const [currentEvents, previousEvents] = await Promise.all([
    store.events.listEvents({ from: win.from.toISOString(), to: win.to.toISOString() }),
    store.events.listEvents({ from: prevStart.toISOString(), to: win.from.toISOString() }),
  ]);
  const current = countAll(currentEvents);
  const previous = countAll(previousEvents);
  const changes = {};
  for (const def of KPI_DEFS) {
    changes[def.key] = changeFor(current[def.key], previous[def.key]);
  }
  return { current, previous, changes };
}

function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Daily buckets of booking_made for the weekly trend chart. One bucket per
// calendar day from window start through today; days with zero stored bookings
// are real zero counts (empty is a legitimate state), never invented rows.
export function dailyBookingBuckets(events, timeframe, now = new Date()) {
  const win = resolveWindow(timeframe, now);
  const counts = new Map();
  for (const e of events) {
    const d = new Date(e.timestamp);
    if (d < win.from || d >= win.to) continue;
    const key = localDateKey(d);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const buckets = [];
  const cursor = new Date(win.from.getFullYear(), win.from.getMonth(), win.from.getDate());
  const lastDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  while (cursor <= lastDay) {
    const key = localDateKey(cursor);
    buckets.push({ date: key, count: counts.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

// Top 5 leads algorithm (§4.9) — deterministic, real-data only:
//   1. events are pre-filtered to the timeframe by the caller
//   2. engagement score = count of ALL events per client_id
//   3. sort score desc, tie-break by most recent timestamp desc
//   4. take top N; display name = lead_name from that client's most recent
//      event payload, else client_id verbatim (never synthesized)
//   5. fewer than N distinct clients -> only what exists, no filler rows
export function topLeads(events, limit = 5) {
  const byClient = new Map();
  for (const e of events) {
    let entry = byClient.get(e.client_id);
    if (!entry) {
      entry = { client_id: e.client_id, count: 0, lastTs: 0, name: null };
      byClient.set(e.client_id, entry);
    }
    entry.count += 1;
    const ts = Date.parse(e.timestamp);
    if (ts > entry.lastTs) {
      entry.lastTs = ts;
      const ln = e.payload && typeof e.payload.lead_name === 'string' && e.payload.lead_name.trim();
      entry.name = ln ? ln.trim() : null;
    }
  }
  return [...byClient.values()]
    .sort((a, b) => b.count - a.count || b.lastTs - a.lastTs)
    .slice(0, limit)
    .map((entry) => ({
      client_id: entry.client_id,
      name: entry.name,
      engagement: entry.count,
      last_event_at: new Date(entry.lastTs).toISOString(),
    }));
}
