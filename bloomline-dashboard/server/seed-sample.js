// server/seed-sample.js — `npm run seed`
// Writes clearly-labeled sample events DIRECTLY through createStore() (spec §6.6) —
// the dev server does NOT need to be running, and it works identically in both
// adapter modes. Every event carries payload.meta.sample = true (§5.2.4) so the UI
// shows the "SAMPLE DATA" badge. Deterministic (no Math.random) so repeated runs
// produce identical timestamps relative to "now".
//
// This is the ONLY code path allowed to create events (§5.2.4). Real webhook
// traffic never sets payload.meta.sample.
import { resolveConfig } from './config.js';
import { createStore } from './store.js';

// Lead identities used ONLY as labeled sample data.
const LEADS = [
  { clientId: 'lead-samp-1001', name: 'Sofia Reyes', channel: 'instagram' },
  { clientId: 'lead-samp-1002', name: 'Amara Okafor', channel: 'website' },
  { clientId: 'lead-samp-1003', name: 'Jules Whitfield', channel: 'shopify' },
  { clientId: 'lead-samp-1004', name: 'Mina Park', channel: 'instagram' },
  { clientId: 'lead-samp-1005', name: 'Elle Hartley', channel: 'website' },
  { clientId: 'lead-samp-1006', name: 'Nadia Brooks', channel: 'instagram' },
  { clientId: 'lead-samp-1007', name: 'Lena Ortiz', channel: 'email' },
  { clientId: 'lead-samp-1008', name: 'Priya Shah', channel: 'shopify' },
];

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

// [event_type, leadIndex, hoursAgo, payloadExtra]
const PLAN = [
  // --- today (so the `today` timeframe has data) ---
  ['booking_made', 0, 1, { status: 'scheduled' }],
  ['booking_made', 1, 3, { status: 'scheduled' }],
  ['conversation_started', 2, 2, {}],
  ['conversation_started', 3, 5, {}],
  ['follow_up_triggered', 4, 4, { due_at: hoursAgo(-12) }],
  ['lead_qualified', 5, 6, { reason: 'bulk_order' }],
  ['handed_off_to_human', 6, 7, { reason: 'bulk_order', assigned_to: 'Sarah (LaunchOps)' }],
  ['conversation_started', 7, 8, {}],
  ['booking_made', 3, 9, { status: 'scheduled' }],
  ['follow_up_triggered', 0, 10, { due_at: hoursAgo(-24) }],
  // --- this week (past 6 days) ---
  ['booking_made', 2, 26, { status: 'completed' }],
  ['conversation_started', 0, 30, {}],
  ['handed_off_to_human', 1, 34, { reason: 'bulk_order', assigned_to: 'Sarah (LaunchOps)' }],
  ['booking_made', 4, 50, { status: 'scheduled' }],
  ['lead_qualified', 2, 60, { reason: 'bulk_order' }],
  ['conversation_started', 5, 70, {}],
  ['follow_up_triggered', 1, 80, { due_at: hoursAgo(-120) }],
  ['booking_made', 6, 100, { status: 'completed' }],
  ['conversation_started', 3, 110, {}],
  ['handed_off_to_human', 4, 130, { reason: 'billing_question', assigned_to: 'Sarah (LaunchOps)' }],
  // --- last 30 days ---
  ['booking_made', 5, 190, { status: 'completed' }],
  ['booking_made', 7, 240, { status: 'completed' }],
  ['conversation_started', 1, 280, {}],
  ['conversation_started', 6, 320, {}],
  ['follow_up_triggered', 3, 350, { due_at: hoursAgo(-400) }],
  ['lead_qualified', 0, 400, { reason: 'bulk_order' }],
  ['handed_off_to_human', 7, 430, { reason: 'bulk_order', assigned_to: 'Sarah (LaunchOps)' }],
  ['booking_made', 0, 480, { status: 'completed' }],
  ['conversation_started', 4, 520, {}],
  ['follow_up_triggered', 5, 560, { due_at: hoursAgo(-600) }],
  ['booking_made', 1, 620, { status: 'completed' }],
  ['handed_off_to_human', 2, 660, { reason: 'sizing_question', assigned_to: 'Sarah (LaunchOps)' }],
  ['lead_qualified', 3, 690, { reason: 'bulk_order' }],
  // --- last 60 days ---
  ['booking_made', 3, 800, { status: 'completed' }],
  ['conversation_started', 7, 850, {}],
  ['follow_up_triggered', 2, 900, { due_at: hoursAgo(-950) }],
  ['conversation_started', 0, 980, {}],
  ['lead_qualified', 6, 1040, { reason: 'bulk_order' }],
  ['booking_made', 6, 1120, { status: 'completed' }],
  ['handed_off_to_human', 5, 1200, { reason: 'bulk_order', assigned_to: 'Sarah (LaunchOps)' }],
  ['conversation_started', 2, 1280, {}],
  ['follow_up_triggered', 7, 1340, { due_at: hoursAgo(-1400) }],
  ['booking_made', 4, 1420, { status: 'completed' }],
  ['lead_qualified', 1, 1480, { reason: 'bulk_order' }],
  ['conversation_started', 6, 1560, {}],
];

async function main() {
  const config = resolveConfig(); // throws per §4.5 — seed fails loudly on misconfig
  const store = createStore(config);

  const counts = {};
  let written = 0;
  for (const [eventType, leadIndex, hAgo, extra] of PLAN) {
    const lead = LEADS[leadIndex];
    const record = await store.events.saveEvent({
      event_type: eventType,
      client_id: lead.clientId,
      timestamp: hoursAgo(hAgo),
      payload: {
        lead_name: lead.name,
        channel: lead.channel,
        ...extra,
        meta: { sample: true },
      },
    });
    if (!record || record.id === undefined) {
      throw new Error(`seed: saveEvent returned no record for ${eventType} (${lead.clientId})`);
    }
    counts[eventType] = (counts[eventType] || 0) + 1;
    written += 1;
  }

  console.log(`[seed] wrote ${written} labeled sample events via createStore() (mode: ${config.mode}).`);
  for (const [type, n] of Object.entries(counts)) {
    console.log(`[seed]   ${type}: ${n}`);
  }
  console.log('[seed] Every event carries payload.meta.sample = true -> UI shows the "SAMPLE DATA" badge.');
  if (config.mode === 'local-file') {
    console.log('[seed] Events appended to ./data/events.json');
  } else {
    console.log('[seed] Events inserted into Supabase `events` table (service role).');
  }
}

main().catch((err) => {
  console.error('[seed] FAILED:', err.message);
  process.exit(1);
});
