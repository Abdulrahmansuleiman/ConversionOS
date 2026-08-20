# Client Dashboard Build Playbook

The exact process used to build the **Pipeline** dashboard (forked from `bloomline-dashboard`).
**Follow this for every new client dashboard.** Read this before touching any dashboard work.

Template repo: `bloomline-dashboard/` — the canonical dashboard codebase. Each new client is a
**fork + rebrand**, never a from-scratch build. After Pipeline, `pipeline-dashboard/` is the
richer reference (conversion rate + follow-up speed KPIs, Vercel wiring).

---

## Phase 0 — Discovery (Leader asks Raymon first)

Before writing any code, confirm with Raymon:

- Client name + brand color (theming tokens live in `src/theme.ts`).
- Which KPIs to track. Pipeline's set (the default now):
  - **Bookings** + **Conversion Rate** = `booking_made` ÷ `conversation_started`.
  - **Human Handovers** (count) + **Handover Rate** = `handed_off_to_human` ÷ `conversation_started`.
  - **Follow-ups** (count) + **speed** = avg hours from a lead's first conversation to first follow-up.
- Webhook event types available from GHL→n8n. Canonical set: `conversation_started`,
  `booking_made`, `handed_off_to_human`, `follow_up_triggered`. Anything else is stored but uncounted.
- Booking webhook may arrive later — Conversion Rate stays empty (null) until then. Build it now anyway.
- **Ask Raymon for the n8n webhook URLs (one per event).** They are HTTP Request nodes inside the
  n8n workflow that forward GHL data to the dashboard's `/api/webhook/events`. See the
  "n8n webhook vocabulary" below — get every URL, and ideally the workflow's exported JSON too.
- GitHub repo URL (user creates the repo and imports to Vercel — agent never touches Vercel dashboard).
- Data store is **always Supabase**, but each client dashboard gets its **own tables**
  (`events`, `dashboard_users`). The agent-memory `documents` table is NEVER touched.

## ConversionOS workflow map (GHL → n8n → GHL + dashboard)

Canonical diagram: **`N8N_WORKFLOW.png`** in the repo root (kept for every project — the
workflow is the SAME shape for every client; only industry, AI persona, and tracked KPIs change).
Exported JSON lives at repo root as `n8n-conversionos.json`. Verified against the Pipeline export.

The workflow is the **ConversionOS AI Text Agent**. GHL fires the entry webhook, n8n routes on
`body.customData['AI Type']` into one of three lanes, each lane replies back into GHL (which sends
the WhatsApp/SMS/IG message). To feed a dashboard, the lanes ALSO fire the dashboard receiver.

### The chain, precisely

1. **GHL** form/trigger → **n8n Webhook** (entry — the FIRST webhook that hits before routing):
   `https://demoacct.app.n8n.cloud/webhook/e94670d8-d66d-499f-9460-f00e6cbd1fa1`
   Body (GHL form data): `contact_id`, `first_name`, `last_name`, `email`, `company_name`,
   `location`, `tags`, `customData['AI Type']` (`AI Intro Message Agent` | `AI Conversation Agent`
   | `AI Follow Up Agent`), `body['Message Aggregator']` (the message text).
2. **Set Contact ID** → extracts `contact_id`.
3. **Switch** → routes on `customData['AI Type']`:
   - **Intro lane** (red): AI Intro Message Agent (first-touch "hey {first name}, amy here…") →
     Segment Response1 (splits into ≤5 message JSON) → **HTTP Request** → POSTs to GHL webhook-trigger
     `…/B6TdzICB5MQ9d9MbWaEY` (GHL sends the intro WhatsApp message).
   - **Conversation lane** (blue): **Classify (Human/AI)** → two branches:
     - branch "Human" → **HTTP Request2** → POSTs to GHL webhook-trigger `…/NLQvLGEUZ2wc4VsNkgNA`
       (triggers GHL's human-handover workflow).
     - branch "AI" → AI Conversation Agent (lead qualification, booking link) → Segment Response →
       **HTTP Request1** → POSTs to GHL webhook-trigger `…/B6TdzICB5MQ9d9MbWaEY` (sends the reply).
   - **Follow-up lane** (green): Follow Up AI (decides `followUpNeeded`) → **HTTP Request3** →
     POSTs to GHL webhook-trigger `…/ZnQYypDQVwFZBdMwP6bi` (triggers GHL follow-up send).
4. Shared infra: Postgres Chat Memory (session), Supabase Vector Store (`documents` table = company
   knowledge), OpenAI Embeddings + Chat Model, structured output parsers.

> ⚠️ **Direction correction (from the Pipeline export):** the three
> `services.leadconnectorhq.com/hooks/<locId>/webhook-trigger/…` URLs are n8n→GHL **OUTBOUND**
> triggers (n8n makes GHL send a message / run a workflow). They are NOT dashboard event sources.
> The dashboard receives events only from HTTP Request nodes that explicitly POST to its
> `/api/webhook/events` endpoint.

### Wiring a dashboard into this workflow (3 nodes to add in n8n)

Add one `HTTP Request` node (POST, JSON body) at each lane end — each fires AFTER the existing
reply node so the event lands only when the action really happened:

| Lane / position | node name to add | event_type | body |
|---|---|---|---|
| Intro lane, after HTTP Request | "Dashboard - Conversation" | `conversation_started` | `client_id` = Contact ID; **`payload.lead_name` = `body.first_name` (REQUIRED — feeds the real Top-5-leads table)**; payload: `company` = `body.company_name`, `channel` from `body.tags` |
| Conversation lane, on the Human branch after HTTP Request2 | "Dashboard - Handover" | `handed_off_to_human` | `client_id` = Contact ID |
| Follow-up lane, after HTTP Request3 | "Dashboard - Follow Up" | `follow_up_triggered` | `client_id` = Contact ID; payload: `suggested` = `suggestedFollowUp` |
| Booking (added later) | GHL booking trigger → n8n | `booking_made` | `client_id` = Contact ID |

**Top-5-leads rule (non-negotiable):** the conversation node MUST include `payload.lead_name`
from real GHL data. The table ranks real contacts by event engagement and displays that real name
(or the contact_id verbatim — never a synthesized/placeholder name). Sample rows carry
`payload.meta.sample = true` (SAMPLE DATA badge, dev-only).

All POST to `https://<deployment>.vercel.app/api/webhook/events`. The receiver persists
`event_type`, `client_id`, `timestamp`, `payload` into Supabase. KPI mappings:
`conversation_started` counts a conversation, `booking_made` ÷ conversations = conversion rate,
`handed_off_to_human` = handover (+ rate), `follow_up_triggered` = follow-up count, and speed =
avg time from a lead's first conversation to first follow-up.

> Rule: never guess the mapping between an n8n node and an `event_type`. If the workflow JSON
> isn't available, ask for it — guessing which webhook means "conversation started" invents data.

### n8n node wiring — EXACT config + troubleshooting (proven live on Pipeline)

The dashboard nodes are plain **HTTP Request** nodes (type `n8n-nodes-base.httpRequest`), named
`Dashboard - Conversation` / `Dashboard - Handover` / `Dashboard - Follow Up`. Config on each:

- **Method:** POST · **URL:** `https://<deployment>/api/webhook/events`
- **Send Body:** ON · **Body Content Type:** JSON · **Specify Body:** **Using JSON**
- Paste the plain JSON body straight in — n8n fills in the `{{ }}` expressions itself.
  (If the saved row ever shows literal `{{ ... }}` text, the body field isn't resolving
  expressions → click the **fx** button on the Body field, then re-paste.)

| failure signature (server response / saved row) | cause | fix |
|---|---|---|
| `400 event_type is required` | body sent as a JSON **string** — "Specify Body" is on **Using Parameters** (it quotes every value) | switch Specify Body to **Using JSON** |
| saved row has literal `{{ $('Set Contact ID')... }}` text | body field NOT resolving expressions | click **fx** on the Body field, re-paste |
| events never arrive | workflow not **Saved** or not **Active** — n8n runs the last saved version | Save (Ctrl/Cmd+S) after every node change |
| duplicate/extra events (same lead counted twice) | leftover test node (e.g. `Dashboard - Conversation1`) | delete the duplicate node |

Verify: execute the node → must be **green 201**, and the response record shows the **real**
GHL `contact_id` + real `first_name` (never `{{ }}` text). Then confirm in the dashboard:
`/api/events`, `/api/kpis?timeframe=today`, `/api/top-leads` (real name = real people rule).

**Conversion Rate is expected to read 0% until the booking webhook is wired** (0 `booking_made`
÷ N conversations). Not a bug — it's the honest empty state. 4th node, added later:

```json
{
  "event_type": "booking_made",
  "client_id": "{{ $('Set Contact ID').item.json['Contact ID'] }}",
  "payload": {
    "lead_name": "{{ $('Webhook').item.json.body.first_name }}"
  }
}
```
(fires when a GHL booking trigger → n8n; same URL + config as the other three.)

### Discovery questions to ask Raymon (per client, in this order)
1. What is the GHL **form-submit / entry** webhook URL (the first one that hits n8n)?
2. What are the three `customData['AI Type']` values routed by the Switch? (usually Intro /
   Conversation / Follow Up — confirm they're unchanged per client)
3. Is there a **booking** webhook yet? If not, note that Conversion Rate stays null until it lands.
4. Can I have the **n8n workflow JSON** (export) + the diagram? I read the HTTP Request nodes and
   map each lane to its `event_type`.
5. Which fields does the form capture (lead name, company, channel, phone)? Those go in `payload`.
6. Which GHL **webhook-trigger** URLs does n8n POST back to? (so I know where GHL sends from)

### What I collect from Raymon for a new client (the full intake)

| # | I ask for | why it matters |
|---|---|---|
| 1 | Client **name** + **brand color** | theming tokens (`theme.ts`), sidebar/header/favicon |
| 2 | **Industry** + the **AI persona** (name, company, tone) the workflow uses | I know what the agent says, and that only these change per client |
| 3 | **Tracked KPIs** (default set: bookings+conversion rate, handovers+rate, follow-ups+speed) | which cards/charts get built |
| 4 | **Entry webhook URL** (GHL → n8n, first one that hits) + the three `AI Type` switch values | confirms routing; entry webhook carries form data incl. `first_name`, `contact_id` |
| 5 | The **n8n workflow export JSON** (+ diagram) | read the HTTP Request nodes and map each lane to its `event_type` — no guessing |
| 6 | GHL **booking webhook** status (now or later) | Conversion Rate KPI is null until `booking_made` exists |
| 7 | **Form fields** the GHL form captures (first name, company, channel, phone…) | which go into `payload`; `first_name` feeds the real Top-5-leads table |
| 8 | **GitHub repo URL** | push target (user creates it + imports to Vercel) |

## Phase 1 — Fork + rebrand

1. Copy `bloomline-dashboard/` (or the latest built dashboard) to `<client>-dashboard/`.
2. `npm install`; then fix the scaffold/template drift (Vite template ships TS 6 + no react deps):
   - `npm install react react-dom`
   - Pin `typescript@~5.7.2` and `express@^4.22.2` (known-good — newer majors broke the build).
   - Replace vanilla `tsconfig.json` with solution-style:
     `{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }`
   - `package.json` scripts:
     `dev` = `concurrently -k "npm:dev:client" "npm:dev:server"`,
     `dev:client` = `vite`, `dev:server` = `node server/index.js`,
     `build` = `tsc -b && vite build`, `seed` = `node server/seed-sample.js`.
3. Rebrand: `src/theme.ts` palette (client color), `src/components/Sidebar.tsx` (logo mark + company
   name), `src/components/Header.tsx` (subtitle), `index.html` (title, favicon), `public/<client>.svg`.
4. `.env` — local-file mode first (empty `SUPABASE_URL`, `WEBHOOK_PORT=4001`). `.gitignore` += `data`, `.env`.

## Phase 2 — Backend KPI work (per client tracked KPIs)

- `server/kpis.js`: add derived rates (`rate()` → null when denominator is 0, never fake 0%),
  percentage-point change, follow-up speed (`followUpSpeedHours`, null when no paired events),
  daily buckets (`dailySpeedBuckets`). Extend `computeKpis()` current/previous/changes.
- `server/routes/events.js`: add any new endpoint (Pipeline added `GET /api/speed-trend`).
- `server/seed-sample.js`: craft events matching the KPI narrative (conversation→follow-up pairs per lead).
- Types + frontend wiring: `src/types/events.ts`, `src/api/client.ts`, a `useSpeedTrend`-style hook,
  a chart component (`SpeedTrendChart`), and `DashboardTab` KPI grid + subtitle/empty states.
- `KpiCard` contract: `value: number | null` renders "—"; `format`, `subtitle`, `changeSuffix`
  ("pts" for rate cards), `lowerIsBetter` inverts tone (speed).

## Phase 3 — Verify locally BEFORE any deploy

1. `npm run seed` → `node server/index.js` (or `npm run dev`).
2. Hit `/api/kpis?timeframe=today|this_week`, `/api/speed-trend`, POST a webhook event (expect 201).
3. `npm run build` must pass (`tsc -b && vite build`).
4. **Delete test rows afterward** so the client starts clean.

## Phase 4 — Supabase (the user MUST run the SQL)

- The agent **cannot create tables** (no DB password/PAT; PostgREST can't run DDL). Raymon runs it.
- Write `supabase/migrations.sql`: `events` + `dashboard_users` — canonical schema example is
  `pipeline-dashboard/supabase/migrations.sql` (agent-memory `documents` stays untouched).
- Only after the tables exist do `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` go into the dashboard
  `.env` (or Vercel env). `server/config.js` enforces a loud mode matrix:
  `SUPABASE_URL` empty → local-file; both set → supabase; URL set + key empty → **refuse to start**.

## Phase 5 — Push to GitHub (before Vercel)

1. `git init` in the dashboard folder; `git add -A`; verify stage has **no `.env`, `data/`, `node_modules`**.
2. `git commit`; `git branch -M main`; `git remote add origin <user's repo>`; `git push -u origin main`.

## Phase 6 — Make it Vercel-ready (do this BEFORE Raymon imports the repo)

Vercel won't run a long-lived Express process. The pattern (proven on Pipeline):

- `server/app.js`: export the configured Express `app` (no `listen()`).
- `server/index.js`: local runner only (`app.listen`), imports from `app.js`.
- `api/index.js`: `export default app;` — one serverless Function for the whole backend.
- `vercel.json`:
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api/index" },
      { "source": "/(.*)", "destination": "/index.html" }
    ],
    "functions": { "api/index.js": { "maxDuration": 30 } }
  }
  ```
- `server/config.js`: if `process.env.VERCEL === '1'` and `SUPABASE_URL` is empty → **throw loudly**
  (local-file writes don't work on Vercel's read-only filesystem; never serve a silent data-losing dashboard).
- Commit + push again. Hand the repo to Raymon: they import to Vercel and set env vars.

### Custom subdomain (standard for every client after Pipeline)

Deliver on a professional URL, not the `*.vercel.app` default. Raymon:
1. Registers the subdomain in **Namecheap**: `<business-name>.launchops.click`.
2. Adds it in **Vercel > Project > Settings > Domains** and updates Namecheap DNS (Vercel gives
   the CNAME/record; TLS is automatic).
3. The dashboard's webhook URL + dashboard "live URL" handed to the client is then
   `https://<business-name>.launchops.click` — never the raw Vercel URL.
Pipeline (first build) stays on `pipeline-dash-seven.vercel.app`; future clients get the subdomain.

## Phase 7 — Post-deploy verification (QA Build)

Raymon gives the live URL. Verify:

1. `GET /` → 200, correct `<title>`.
2. `GET /api/health` → `mode` must be `supabase`. If `local-file`, env vars weren't set on Vercel.
3. `POST /api/webhook/events` (no `timestamp` — let the server stamp it) → 201, then
   `GET /api/kpis?timeframe=today` counts it.
4. `{"error":"failed to compute KPIs"}` = the `events` table doesn't exist yet → user must run the
   migration SQL (they only have to do this once per Supabase project).
5. **Timeframe gotcha:** events with a timestamp in the future are correctly excluded from windows —
   in tests, omit `timestamp` so the server uses its clock.
6. Clean up test rows: `DELETE /rest/v1/events?client_id=in.(...)` via PostgREST with the service key.
7. Handoff to Raymon: point the n8n **ConversionOS** HTTP Request node at
   `https://<deployment>/api/webhook/events` (use the custom `launchops.click` subdomain once
   attached), mapping the 3–4 GHL hooks to `event_type`.
   Optional hardening: set `GHL_WEBHOOK_SECRET` in Vercel env.

## Checklist (every dashboard)

- [ ] Phase 0 answers recorded (client, color, KPIs, event types, repo URL)
- [ ] Fork + rebrand complete (theme, sidebar, header, index.html, favicon)
- [ ] Toolchain: react installed, TS ~5.7.2, express ^4.22.2, solution tsconfig, scripts
- [ ] Backend KPIs + seed + types/hooks/charts done
- [ ] `npm run build` green; endpoints + webhook verified locally; test rows cleaned
- [ ] `supabase/migrations.sql` written; user ran it; keys in dashboard `.env`
- [ ] GitHub pushed clean (no secrets)
- [ ] Vercel-ready (app.js, api/index.js, vercel.json, VERCEL guard)
- [ ] Live verification passed (health=supabase, webhook 201→counted, KPIs compute)
- [ ] n8n dashboard nodes added (Conversation/Handover/Follow Up) — Using JSON + fx expression mode; real lead test lands in `/api/events` with real name
- [ ] Booking webhook (`booking_made`) planned — Conversion Rate intentionally 0% until it's wired
- [ ] Custom subdomain `<business>.launchops.click` added in Vercel + DNS (from client #2 onward)
- [ ] Breakdown report to Raymon (Section 8 format)