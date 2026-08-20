# Bloomline Apparel — AI Agent Performance Dashboard — Build Spec + Roadmap

**Client slug:** `bloomline-apparel`
**Prepared by:** Infrastructure Agent (LaunchOps Onboarding Agent System)
**Status:** DRAFT — pending QA (Infrastructure) sign-off before release to the Builder Agent
**Scope:** LOCAL ONLY — **no Vercel deployment, no remote hosting.** `npm run dev` must work on this machine.

> Read first, in this order (all mandatory):
> 1. `AGENTS.md` (§5 Infrastructure, §6 Builder, §7 Data Flow, §9 Global Rules)
> 2. `docs/data-model.md` — the Supabase `events` schema is **non-negotiable**
> 3. `docs/performance/builder.md` — the Builder's own Standards
> 4. The `dashboard-builder` skill (`.config/opencode/skills/dashboard-builder/SKILL.md`) — its layout rules are canonical for the UI
> 5. The `supabase` skill (`.opencode/.agents/skills/supabase`) — for schema/migrations/client wiring
> 6. `clients/bloomline-apparel/facts.json` — brand facts only; do NOT import contract/invoice numbers into the dashboard

---

## 1. Overview

Build a **client-facing agent-performance dashboard for Bloomline Apparel** — a text AI
agent for ecommerce (women's activewear; channels: Instagram DM, website chat widget,
Shopify, email). The dashboard shows what the AI agent is doing for the client in
real time: bookings made, conversations handled (by channel), human handoffs
(especially bulk-order lead qualification), outstanding follow-ups, and top leads.

- **Brand:** "Bloomline Apparel" (sidebar company name, verbatim from
  `facts.json` → `client_display`), built by **LaunchOps AI**.
- **Data source:** events forwarded from n8n/GoHighLevel via webhook → persisted →
  dashboard. **No dashboard number may be computed live-only with no stored record
  behind it** (AGENTS.md §7).
- **Persistence:** primary = Supabase (`events` table, schema in `docs/data-model.md`);
  dev fallback = local JSON file. **Both are real persistence** — the fallback is
  explicit, labeled, and never silent. See §4.4 (storage decision) and §4.5 (config
  resolution).
- **Critical constraint (confirmed):** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  are **currently EMPTY** in `.env`. The build must therefore ship with the
  `LocalFileAdapter` active by default and flip to Supabase automatically when keys
  are added — **no UI change, no rebuild**.
- **No deployment.** This spec intentionally has no Vercel/CI steps. The Build QA
  agent's "deployment succeeded" check is replaced by: "local `npm run dev` boots,
  webhook receiver responds, persistence verified in current mode."

### 1.1 Tabs (verbatim from Raymon)

1. Dashboard / Overview
2. Bookings
3. Conversations
4. Follow-ups
5. Human transfers
6. Calendar
7. Settings — **must allow ADDING PEOPLE** (name / email / role)

### 1.2 Fixed UI facts

- Sidebar **220px**, dark gradient; company name + logo; nav items = the 7 tabs; user
  profile at bottom.
- Header: dashboard title, current date, notification bell. **NO search bar.**
- Overview: 5 KPI cards (3+2 grid), conversion donut, timeframe toggle, weekly trend
  chart, and **TOP 5 LEADS** section at the bottom (5 names only, ranked by engagement
  from real event data).
- Reference images to match: `.opencode/dashboard IMG/dashbaord.jpg` and
  `.opencode/dashboard IMG/dashboard.gif` (see §7). The `dashboard-builder` skill's
  layout table is the authoritative text spec of the polish level.

---

## 2. Build Roadmap (ordered stages, with dependencies)

> Rule: no stage may depend on a stage that hasn't happened. Each stage must leave the
> project in a runnable state (or explicitly broken-free). Stages are sequential —
> do not start S(n) until S(n-1) is done and verified.

| # | Stage | Depends on | Exit criteria |
|---|-------|-----------|---------------|
| S1 | **Scaffold** — Vite 6 + React 19 + TS 5.7 project `bloomline-dashboard`, install styled-components / recharts / react-icons / express / concurrently / dotenv / @supabase/supabase-js | — | `npm run dev` boots an empty Vite app on :5173; `npm run build` passes |
| S2 | **Theme & brand** — `src/styles/theme.ts` (all colors/typography as tokens), `GlobalStyles.ts`, Inter font, dark sidebar gradient, LaunchOps AI footer | S1 | Brand tokens in one file; sidebar shell renders with company name "Bloomline Apparel" |
| S3 | **Storage abstraction + minimal server** — creates the minimal Express server (`server/index.js`, `server/config.js`, `GET /api/health`; S6 later extends it with all routes) plus `EventStore`/`UserStore` interfaces + `createStore()` factory + config resolution + dev-mode banner | S1 | Minimal Express server boots and `GET /api/health` returns the §4.5 mode; factory returns adapter per §4.5 matrix; banner prints on empty Supabase keys |
| S4 | **LocalFileAdapter** — events + users persisted to `data/*.json`, atomic writes | S3 | Posting events appends to JSON; restart keeps data |
| S5 | **SupabaseAdapter** — `events` + `dashboard_users` tables (SQL in §4.6), service-role writes **server-side only** | S3 | With keys set, writes/reads hit Supabase; same interface as S4 |
| S6 | **Backend API + webhook receiver** — Express server on :4001; `POST /api/webhook/events`, `GET /api/kpis`, `/api/events`, `/api/trend`, `/api/top-leads`, `/api/users`, `/api/calendar` | S4, S5 | Every endpoint verified with real requests; validation returns 400 with JSON error |
| S7 | **Frontend data layer** — `src/api/client.ts` + hooks (`useKpis`, `useEvents`, `useTopLeads`, `useUsers`, `useHealth`); Vite proxy `/api` → :4001 | S6 | Overview shell renders live (empty) data from backend |
| S8 | **Layout shell** — `Sidebar` (220px), `Header`, `TimeframeToggle` (Today / This Week / Last Week / Last Month / Last 2 Months), tab switching; dev-mode badge from `/api/health` | S2, S7 | All 7 nav items switch tabs; badge shows in local mode |
| S9 | **Overview tab** — 5 KPI cards (3+2 grid, value + trend vs previous period), conversion donut (bookings by channel), weekly trend chart | S8 | Empty states render; no fabricated numbers |
| S10 | **Detail tabs** — Bookings (list + calendar view), Conversations, Follow-ups, Human transfers, Calendar (month grid of bookings via `GET /api/calendar`), Settings (users list + add form) | S8 | Each tab reads live API data; add-person persists via store |
| S11 | **TOP 5 LEADS** — bottom of Overview, names ranked by engagement score from persisted events (§4.9) | S9 | Top 5 derived from real events; fallback to `client_id` if no name |
| S12 | **Sample seed + labeling** — `npm run seed` writes clearly-labeled sample events directly through `createStore()` (no server required; `payload.meta.sample = true`); UI "SAMPLE DATA" badge + empty states stay truthful | S6 | Seed events show with badge; deleting `data/*.json` returns to empty states |
| S13 | **Local run verification** — full check matrix (§5.5): fresh install, dev boot, webhook POST, persistence in both adapter modes, timeframe filters, calendar month view, empty states, error paths | S1–S12 all | Every check passes; Builder writes verification report |

**Rationale for ordering:** the receiver (S6) writes through the adapter interface (S3),
so adapters (S4, S5) must exist first — the receiver never talks to Supabase or JSON
directly. The UI (S7–S11) consumes only the backend API, so the API surface (S6) must
exist before any data hook is written. Top leads (S11) needs the API + events (S6/S7).
Seed/labeling (S12) is deliberately late so the real-data path is verified first.

---

## 3. Exact Tech Stack + File / Module Layout

### 3.1 Stack (never deviate)

| Layer | Technology | Version |
|---|---|---|
| Build tool | Vite (react-ts template) | **6.x** |
| Framework | React + TypeScript | **React 19, TS 5.7** |
| Styling | styled-components (CSS-in-JS) | latest 6.x |
| Charts | Recharts | latest |
| Icons | react-icons | latest |
| Backend (dev server + webhook receiver) | Node (ESM) + Express | Node 22 (installed), Express 4 |
| Supabase client | @supabase/supabase-js | latest |
| Dev orchestration | concurrently + dotenv | latest |

Local runtime confirmed on this machine: **Node v22.14.0, npm 10.9.2** — both satisfy
Vite 6 / React 19 requirements.

### 3.2 Project location

Create the project at `C:\Users\lenovo\Desktop\onboarding-agent\bloomline-dashboard\`
(fresh scaffold — do NOT reuse another client's folder, and do NOT write inside
`clients/bloomline-apparel/` except nothing — the dashboard lives at repo root as its
own app). `.env` lives at the project root (see §6.1).

### 3.3 Module layout (authoritative)

```
bloomline-dashboard/
├── package.json                 # "type": "module"; scripts: dev / dev:client /
│                                #   dev:server / build / seed
├── vite.config.ts               # react plugin + server.proxy { '/api': 'http://localhost:4001' }
├── .env                         # SUPABASE_URL=, SUPABASE_SERVICE_ROLE_KEY=,
│                                #   GHL_WEBHOOK_SECRET=, WEBHOOK_PORT=4001
├── .gitignore                   # node_modules, dist, .env, data/
├── index.html                   # title "Bloomline Apparel — Agent Report"; Inter font
├── data/                        # created at runtime; LocalFileAdapter stores here
│   ├── events.json              #   [{ id, event_type, client_id, timestamp, payload }]
│   └── users.json               #   [{ id, name, email, role, created_at }]
├── server/                      # plain Node ESM JS (no TS build step for the server)
│   ├── index.js                 # Express app: mounts routes, dotenv, startup banner
│   ├── config.js                # reads .env → { mode, supabaseUrl, supabaseKey, webhookPort, webhookSecret }
│   ├── store.js                 # createStore(): EventStore+UserStore factory per §4.5
│   ├── adapters/
│   │   ├── local-file.js        # LocalFileAdapter (events + users, atomic writes)
│   │   └── supabase.js          # SupabaseAdapter (events + users, service role only)
│   ├── routes/
│   │   ├── webhook.js           # POST /api/webhook/events (validation + persist)
│   │   ├── events.js            # GET /api/events, /api/kpis, /api/trend, /api/top-leads
│   │   ├── calendar.js          # GET /api/calendar (bookings for the Calendar tab month view)
│   │   └── users.js             # GET/POST /api/users
│   ├── kpis.js                  # pure functions: timeframe resolution, KPI counts, trend math
│   └── seed-sample.js           # npm run seed → posts labeled sample events
└── src/
    ├── main.tsx
    ├── App.tsx                  # Sidebar + MainArea(margin-left:220px) + tab router
    ├── theme.ts                 # ALL colors as tokens (SIDEBAR_GRADIENT, ACCENT, POSITIVE, BG…)
    ├── styles/GlobalStyles.ts   # reset, Inter, body BG, thin scrollbar
    ├── types/
    │   ├── events.ts            # NormalizedEvent, EventType union, KpiData, Timeframe
    │   └── users.ts             # DashboardUser, AddUserInput
    ├── api/client.ts            # fetch wrappers (base '/api'); JSON error parsing
    ├── hooks/
    │   ├── useHealth.ts         # mode badge source
    │   ├── useKpis.ts           # GET /api/kpis?timeframe=
    │   ├── useEvents.ts         # GET /api/events?eventType=&timeframe=
    │   ├── useTopLeads.ts       # GET /api/top-leads?timeframe=
    │   ├── useCalendar.ts       # GET /api/calendar?month=YYYY-MM
    │   └── useUsers.ts          # GET/POST /api/users
    ├── components/
    │   ├── Sidebar.tsx          # 220px, dark gradient, logo, nav, user profile bottom
    │   ├── Header.tsx           # title, date, bell — NO search bar
    │   ├── DevModeBadge.tsx     # "DEV MODE: local store — Supabase not configured"
    │   ├── SampleDataBadge.tsx  # shown when visible events carry payload.meta.sample
    │   ├── TimeframeToggle.tsx  # Today / This Week / Last Week / Last Month / Last 2 Months
    │   ├── KpiCard.tsx          # label, value, change badge, colored dot
    │   ├── charts/ConversionDonut.tsx   # Recharts PieChart, inner 52 / outer 80, legend
    │   ├── charts/WeeklyTrend.tsx       # Recharts bar/line, bookings per day
    │   ├── EmptyState.tsx       # standard empty-state component (icon + message + hint)
    │   └── ErrorState.tsx       # standard error component (message + Retry button)
    └── tabs/
        ├── DashboardTab.tsx     # KPIs 3+2, donut, timeframe toggle, trend, TOP 5 LEADS
        ├── BookingsTab.tsx      # bookings table + calendar view toggle
        ├── ConversationsTab.tsx # lead name, channel, status, time
        ├── FollowUpsTab.tsx     # outstanding follow-ups
        ├── HumanTransfersTab.tsx# handoff events
        ├── CalendarTab.tsx      # month grid showing bookings (consumes GET /api/calendar)
        └── SettingsTab.tsx      # users list + Add Person form (name/email/role)
```

**Component rules (from dashboard-builder skill — canonical):**
- Sidebar exactly 220px, full viewport height; main content `margin-left: 220px`,
  flex column; content padding 28px sides / 16px vertical.
- Top row: 1.3fr (KPI cards) : 1fr (donut), 16px gap. KPI grid row 1 = 3 equal columns;
  row 2 = 2 equal columns. KPI card padding 16px 18px.
- `overflow-y: auto` on content; **no horizontal scroll**.
- KPI card: label, value, change badge (up/down), colored dot, on dark card (match
  reference image styling).

---

## 4. Data Contract (non-negotiable)

### 4.1 Canonical event types

`event_type` is one of (union from `docs/data-model.md`, extended for the required
"Total Conversations" KPI and the transcript's bulk-order qualification):

| `event_type` | Meaning | KPI / tab fed |
|---|---|---|
| `booking_made` | AI agent booked a meeting/call | Bookings KPI, Bookings tab, Calendar, weekly trend |
| `handed_off_to_human` | AI handed lead to a human (incl. bulk-order leads) | Human Transfers KPI, Human transfers tab |
| `follow_up_triggered` | Abandoned-cart / follow-up sequence triggered | Follow-ups KPI, Follow-ups tab |
| `conversation_started` | A new conversation began (Instagram / website / Shopify) | Total Conversations KPI, Conversations tab, engagement |
| `lead_qualified` | Bulk-order / wholesale lead flagged for qualification | "Leads Qualified" KPI card (5th card) |

Any `event_type` outside this set is still **persisted verbatim** (never dropped) but is
not counted by KPIs. The dashboard must not assume events beyond what is stored.

### 4.2 Normalized webhook envelope (what n8n must POST)

```jsonc
{
  "event_type": "booking_made",            // required, enum above (case-sensitive)
  "client_id": "ghl-contact-id-or-email",  // required, lead/client identifier
  "timestamp": "2026-08-06T14:30:00Z",     // optional; server uses now() when absent
  "payload": {                             // optional object; defaults to {} when omitted
    "lead_name": "Lead display name",      // OPTIONAL — never fabricate a name if absent
    "channel": "instagram" | "website" | "shopify" | "email" | "other",
    "status": "open" | "resolved" | "handed_off" | "scheduled" | "completed",
    "due_at": "ISO timestamp",             // follow-ups
    "reason": "bulk_order",                // handoffs
    "assigned_to": "human name",           // handoffs
    "meta": { "sample": true }             // ONLY set by npm run seed
  }
}
```

**Validation (server, fail loud):**
- `event_type` missing or not a string → `400 { error: "event_type is required" }`.
- `client_id` missing/empty → `400 { error: "client_id is required" }`.
- `timestamp` invalid → `400 { error: "timestamp must be ISO 8601" }` (or accept + warn —
  choose one; document in code comment). Recommended: reject invalid.
- `payload` missing → default `{}`.
- `payload` is stored as-is (nested JSON preserved); the receiver does **not** flatten,
  rename, or invent fields.
- Optional auth: if `GHL_WEBHOOK_SECRET` is set in `.env`, require header
  `x-webhook-secret` to match (constant-time compare), else `401`. If unset (current
  state), accept unauthenticated and **log a warning at startup**. This is dev scope;
  hardening is a flag for Raymon (§9).

**n8n forwarding note (open item):** the exact raw GoHighLevel webhook body shape is
not known to this system. The n8n workflow MUST normalize the GHL payload to the
envelope above **before** forwarding to `http://localhost:4001/api/webhook/events`.
The receiver does not parse GHL's raw shape. — Flagged for Raymon (§9).

### 4.3 Persisted record (storage shape)

Every persisted event contains exactly (mirror of `docs/data-model.md`):

```jsonc
{
  "id": 1,                        // bigint identity (Supabase) / running int (local)
  "event_type": "booking_made",
  "client_id": "lead-abc",
  "timestamp": "2026-08-06T14:30:00.000Z",   // ISO-8601 UTC, timestamptz in Supabase
  "payload": { }
}
```

### 4.4 Storage abstraction (interfaces)

```ts
// server/adapters — plain JS, but the contract is:
interface EventStore {
  saveEvent(e: { event_type: string; client_id: string; timestamp?: string; payload: object }): Promise<object>;
  // returns the persisted record incl. id + normalized timestamp

  listEvents(filter: { eventTypes?: string[]; from?: string; to?: string; clientId?: string }): Promise<object[]>;
  // 'from'/'to' are ISO strings; inclusive from, exclusive to
}

interface UserStore {
  listUsers(): Promise<Array<{ id: string; name: string; email: string; role: string; created_at: string }>>;
  addUser(u: { name: string; email: string; role: string }): Promise<object>;
  // throws DuplicateEmailError on existing email
}
```

- `SupabaseAdapter` — primary. Uses `@supabase/supabase-js` with the **service role key
  ONLY on the server**. `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are read from
  `process.env` (loaded from `.env` via dotenv); never hardcoded, never sent to the
  browser.
- `LocalFileAdapter` — dev-only fallback. Persists to `data/events.json` /
  `data/users.json`. Writes are **atomic**: write to `*.tmp` then `rename` over the
  target. Reads re-read from disk on every call (no stale in-memory cache).
- **Both adapters expose the same interface** — the rest of the code (routes, KPIs,
  UI) is adapter-agnostic. Switching modes requires **zero UI change**.

### 4.5 Config resolution (mode matrix — CRITICAL)

`server/config.js` evaluates exactly this matrix at startup:

| `SUPABASE_URL` | `SUPABASE_SERVICE_ROLE_KEY` | Mode | Behavior |
|---|---|---|---|
| empty | anything | **`local-file`** | `LocalFileAdapter`; **loud banner** (below); UI badge |
| set | set | **`supabase`** | `SupabaseAdapter`; no banner |
| set | empty | **startup ERROR** | Refuse to start with explicit message (fail loud, no silent fallback): `SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is empty — set both keys or remove SUPABASE_URL to use local dev mode.` |

**Loud banner (local-file mode), printed to server console at startup:**
```
⚠️  DEV MODE: local store — Supabase not configured (SUPABASE_URL is empty in .env)
⚠️  All events and users are persisted to ./data/*.json until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
```
**UI badge:** `GET /api/health` returns `{ ok: true, mode: 'local-file' | 'supabase' }`.
When `mode === 'local-file'`, the header/sidebar shows a persistent badge with the exact
text: **"DEV MODE: local store — Supabase not configured"**. The badge must never appear
in supabase mode. This is explicit, never silent — no pretending Supabase is connected,
no fabricated data.

`GET /api/health` shape: `{ ok: true, mode: 'supabase' | 'local-file' }`.

### 4.6 Supabase schema (apply via the `supabase` skill — SQL editor or migration)

```sql
-- events (canonical, from docs/data-model.md — do not alter columns)
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  event_type  text not null,
  client_id   text not null,
  timestamp   timestamptz not null default now(),
  payload     jsonb not null default '{}'::jsonb
);
create index if not exists events_client_id_idx  on public.events (client_id);
create index if not exists events_event_type_idx on public.events (event_type);
create index if not exists events_timestamp_idx  on public.events (timestamp desc);

-- dashboard_users (users store for Settings → Add people)
create table if not exists public.dashboard_users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  role       text not null,
  created_at timestamptz not null default now()
);
```

Security: service-role key is server-side only (writes + reads via our backend). RLS
may stay disabled while all access is server-side; enable + add policies before any
future client-side read path (note for Raymon, not blocking).

### 4.7 Timeframe semantics (canonical — the Builder must implement exactly this)

| Timeframe | Window (server-resolved, server-local time) |
|---|---|
| `today` | local midnight → now |
| `this_week` | Monday 00:00 local → now |
| `last_week` | now − 7 days → now (rolling) |
| `last_month` | now − 30 days → now (rolling) |
| `last_2_months` | now − 60 days → now (rolling) |

All windows are resolved in the **server's local timezone** (this is a local-only build
— no UTC conversion is applied to window boundaries). `today` = local midnight → now;
`this_week` = Monday 00:00 local → now. Stored `timestamp` values remain ISO-8601 UTC
(`timestamptz`) as the canonical record (§4.3); only the window boundaries are computed
in server-local time.

Rolling windows match the SQL in `docs/data-model.md`
(`now() - interval '1 week'`), are unambiguous, and work identically in the local
adapter and Supabase. **Trend/previous period** = the equal-length window immediately
before the selected window (`[start - length, start)`).

KPI queries (data-model §KPI queries, applied per window):
- Bookings: `count(events) where event_type = 'booking_made'`
- Human transfers: `event_type = 'handed_off_to_human'`
- Follow-ups: `event_type = 'follow_up_triggered'`
- Total conversations: `event_type = 'conversation_started'`
- Leads qualified: `event_type = 'lead_qualified'`

Trend math per KPI card (value + % change vs previous period):
- prev = 0, cur = 0 → change 0%, neutral.
- prev = 0, cur > 0 → show `+100%` with badge label `new`.
- prev > 0 → `round((cur - prev) / prev * 100)`%.
- Percentages are computed from stored counts only — never from assumed baselines.

### 4.8 API surface (backend, all under `/api`)

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | `{ ok, mode }` — powers the dev-mode badge |
| `POST /api/webhook/events` | Receiver; persists event; `201 { record }`; `400`/`401` with JSON error |
| `GET /api/kpis?timeframe=today\|this_week\|last_week\|last_month\|last_2_months` | `{ current: { bookings, humanTransfers, totalConversations, followUps, leadsQualified }, previous: {...}, changes: {...} }` |
| `GET /api/events?eventType=booking_made&timeframe=...&clientId=...` | Rows for tabs, newest first |
| `GET /api/trend?timeframe=...` | Daily buckets of `booking_made` for the weekly trend chart |
| `GET /api/calendar?month=YYYY-MM` | Bookings for the Calendar tab month view — list of `{ event_id, date_time, lead_name, client_id, channel, status }`, newest first, derived from `events` where `event_type = 'booking_made'` within that month (server-local month window; see §4.7) |
| `GET /api/top-leads?timeframe=...&limit=5` | Top 5 leads per §4.9 |
| `GET /api/users` | Dashboard users |
| `POST /api/users` | Add person `{ name, email, role }`; `201`; `400` invalid; `409` duplicate email |

Errors: every failure returns JSON `{ error: string }` with correct status code. No
HTML error pages, no empty 200s.

### 4.9 Top 5 leads algorithm (deterministic, real-data only)

1. Filter persisted events to the selected timeframe.
2. **Engagement score** per `client_id` = count of ALL its events in the window.
3. Sort by score desc; tie-break by most recent `timestamp` desc.
4. Take the top 5. **Display name** = `lead_name` from that client's most recent event
   payload; if absent, display the `client_id` **verbatim** — never synthesize or
   prettify a name, never show a placeholder token.
5. Fewer than 5 distinct clients → show only what exists (no filler rows).

### 4.10 Dashboard users (Settings)

`DashboardUser { id, name, email, role, created_at }`. Add form validation: name
non-empty, email matches a basic regex, role non-empty (suggested values Owner /
Manager / Viewer — free text is acceptable). Duplicate email → `409` with a clear
message shown in the UI. Persisted through the same abstraction (`dashboard_users`
in Supabase, `data/users.json` in local mode). No auth/roles enforcement in this build
— the dashboard is a view + add-people only (flag: real auth is out of scope).

### 4.11 Conversion donut

Segments = `booking_made` events grouped by `payload.channel`. Channel unknown/missing
→ single segment `"Unknown"`. If zero bookings → the donut renders an empty-state
message, not a fake 100% slice.

---

## 5. Anti-Hallucination + Error-Handling Instructions (for the Builder)

> Written with the `prompt-engineer` skill (`.opencode/.agents/skills/prompt-engineer`).
> Treat this section as part of your system prompt. It outranks any convenience.

### 5.1 Identity & grounding

You are the Builder Agent building the Bloomline Apparel dashboard from THIS spec.
Grounding, in priority order:
1. This spec (`clients/bloomline-apparel/build-spec/dashboard-build-spec.md`) — if
   anything is ambiguous, STOP and ask the Leader. Do not guess.
2. `docs/data-model.md` — the events schema is non-negotiable.
3. `docs/performance/builder.md` Standards.
4. The `dashboard-builder` skill layout rules and the reference images (§7).

Client hygiene: build only for `bloomline-apparel`. Do not copy code, data, or
artifacts from any other client. The only brand strings to use verbatim are
**"Bloomline Apparel"** and **"LaunchOps AI"** (from `facts.json`). Do NOT import any
other `facts.json` tokens into the dashboard (addresses, phone numbers, amounts, dates
are PDF facts, not dashboard content).

### 5.2 The "Don't Invent Data" clause (non-negotiable)

1. **Every number on the dashboard must be derivable from persisted events** via the
   backend API. No hardcoded metric values, no Math.random in place of data, no
   "looks plausible" defaults.
2. **Never fabricate lead names, channels, statuses, or timestamps.** If `payload`
   lacks `lead_name`, display the `client_id`. If it lacks `channel`, display `—`
   (em dash) or `Unknown`. Placeholder tokens like `{{...}}`, `[Name]`, `N/A` as fake
   values are forbidden; use real empty-state UI instead.
3. **Empty stores render empty states** — e.g. "No bookings yet. Waiting for the first
   webhook from n8n/GoHighLevel." Empty is a legitimate state; never pad it with sample
   or invented rows.
4. **Seed/demo data is the only exception, and it must be labeled.** Only `npm run
   seed` may create events, and every seeded event carries `payload.meta.sample = true`.
   The UI must show a "SAMPLE DATA" badge whenever any visible event has that flag, and
   the Overview must note sample data is present. Without the flag, data is treated as
   real.
5. **No silent fallbacks.** An API failure renders `ErrorState` (message + Retry),
   never zeros, never the previous successful snapshot presented as live, never mock
   data. `console.error` the actual error.

### 5.3 Fail-loud rule

- Backend: validation/DB errors → non-2xx JSON `{ error }`; server logs the stack. If
  the store misconfigures (see §4.5 matrix), the server refuses to start with an
  explicit message.
- Frontend: any fetch that rejects → `ErrorState` with retry; `error` boundary per tab
  so one broken tab never blanks the whole app.
- Never swallow an exception to make a screen "look fine". If you can't make a piece
  work, report it in your handoff summary — do not quietly ship around it.

### 5.4 Grounding rules for UI copy

- Header title: "Agent Report" (dashboard-builder convention) with client context
  "Bloomline Apparel".
- Tabs and labels exactly as §1.1 / §4.1. Do not rename KPIs or event types.
- Timeframe labels: Today / This Week / Last Week / Last Month / Last 2 Months — maps
  to §4.7 windows server-side. Do not add custom windows unless spec'd.

### 5.5 Verification checklist (run before reporting done — mirrors Build QA)

1. `npm run dev` boots frontend :5173 + backend :4001; Vite proxy works.
2. `POST /api/webhook/events` with a valid envelope returns 201 and the row appears in
   `GET /api/events` AND the Overview KPIs update.
3. Invalid envelope (no `event_type`) returns 400 with JSON error; UI shows ErrorState
   where applicable — no crash.
4. Every persisted record has `event_type`, `client_id`, `timestamp`, `payload`.
5. Timeframe filters return exactly the §4.7 windows (spot-check with known timestamps).
6. Empty store → empty states everywhere (wipe `data/*.json` to test).
7. Local mode: banner + badge visible. Supabase mode (after adding keys): no banner, no
   badge, same UI.
8. `npm run seed` writes labeled sample data **directly through `createStore()` — no
   server required** (see §6.6) → "SAMPLE DATA" badge shows; delete `data/*.json` →
   empty states return.
9. Add a person in Settings → appears in list; duplicate email → 409 message.
10. Calendar tab shows the POSTed bookings for the visible month (`GET /api/calendar`);
    a booking whose timestamp falls outside the visible month does not appear.
11. `npm run build` passes cleanly (type-check + build).

---

## 6. Local Run Instructions (for the Builder and QA)

### 6.1 Setup

```powershell
# from C:\Users\lenovo\Desktop\onboarding-agent
npm create vite@latest bloomline-dashboard -- --template react-ts
cd bloomline-dashboard
npm install
npm install styled-components recharts react-icons
npm install express @supabase/supabase-js dotenv
npm install -D concurrently @types/react @types/react-dom @vitejs/plugin-react
```

`.env` (project root — do NOT modify the repo-root `.env`; create this one):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GHL_WEBHOOK_SECRET=
WEBHOOK_PORT=4001
```

`package.json` scripts:
```jsonc
{
  "dev": "concurrently -k \"npm:dev:client\" \"npm:dev:server\"",
  "dev:client": "vite",
  "dev:server": "node server/index.js",
  "build": "tsc -b && vite build",
  "seed": "node server/seed-sample.js"
}
```

`vite.config.ts` must include:
```ts
server: { proxy: { '/api': 'http://localhost:4001' } }
```

### 6.2 Run

```powershell
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend/webhook receiver: `http://localhost:4001` (root endpoint
  `POST /api/webhook/events`)
- Console shows the dev-mode banner (local mode) and a warning if
  `GHL_WEBHOOK_SECRET` is unset.

### 6.3 POST a test event (PowerShell)

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:4001/api/webhook/events" `
  -ContentType "application/json" `
  -Body '{"event_type":"booking_made","client_id":"lead-test-001","timestamp":"2026-08-06T10:00:00Z","payload":{"lead_name":"Test Lead One","channel":"website"}}'
```
Expect `201` with the persisted record (incl. `id`). Repeat with the other four
event types. Also test a bad payload (omit `event_type`) → expect `400 { error }`.

### 6.4 Verify persistence — local mode (default)

1. Confirm console banner printed at server start.
2. Confirm UI badge reads "DEV MODE: local store — Supabase not configured".
3. After POSTing, open `data/events.json` — the records are there, timestamped.
4. Refresh the Overview — KPIs, donut, trend, and Top 5 Leads reflect the POSTed
   events; the lead name "Test Lead One" appears (from payload, not invented).
5. Restart the server — data persists (file re-read on boot).

### 6.5 Verify persistence — Supabase mode (flip without code change)

1. Stop the server. Put real values into `bloomline-dashboard/.env`:
   `SUPABASE_URL=...` and `SUPABASE_SERVICE_ROLE_KEY=...`.
2. Apply the §4.6 SQL to the Supabase project (SQL editor or migration).
3. `npm run dev` again. **No banner**, no badge. `GET /api/health` → `{ mode: 'supabase' }`.
4. POST the same test events → rows appear in the Supabase `events` table
   (service-role writes), same dashboard UI, same numbers.
5. Flip back to empty keys to confirm the reverse switch also works cleanly.

> If only `SUPABASE_URL` is set (no key), the server must refuse to start with the
> §4.5 error — verify this too.

### 6.6 Seed mechanics — how `npm run seed` writes sample data

`npm run seed` executes `server/seed-sample.js`, which constructs the store via
`createStore()` from `server/config.js` and writes the labeled sample events **directly
through the `EventStore` interface — the dev server does NOT need to be running**, and
it works identically in both adapter modes:

- Local mode: events are appended to `data/events.json` via `LocalFileAdapter`.
- Supabase mode: events are inserted into the `events` table via `SupabaseAdapter`
  (service role, server-side only).

Every seeded event carries `payload.meta.sample = true` (see §5.2.4). If the store
misconfigures (§4.5), the seed script fails loudly instead of writing partial data.

**Optional — exercise the HTTP path too:** with the dev server running, POST the same
events to `POST /api/webhook/events` (see §6.3). That path tests the receiver +
validation + persistence over HTTP; `npm run seed` tests the store layer directly. Both
paths write through the same `createStore()` factory and produce identical records.

---

## 7. Reference Images (must-match polish)

Open and match these before/while building (Builder: visually inspect both files —
they are the ground truth for polish; the dashboard-builder skill's layout table is the
text version):

- `C:\Users\lenovo\Desktop\onboarding-agent\.opencode\dashboard IMG\dashbaord.jpg`
  — the static reference screenshot of the target dashboard look.
- `C:\Users\lenovo\Desktop\onboarding-agent\.opencode\dashboard IMG\dashboard.gif`
  — animated reference (interactions, hover states, transitions).

Match: dark-gradient sidebar, card styling (dark KPI cards with colored dots and
change badges), donut + legend, weekly trend bars, table styling, spacing, rounded
corners, and the general "premium agency deliverable" finish. Do not copy another
client's branding — this is Bloomline Apparel.

**Brand tokens:** no brand hex was provided by Raymon. Implement every color as a token
in `src/theme.ts` (SIDEBAR_GRADIENT, ACCENT_COLOR, POSITIVE_COLOR, BG_COLOR, card
colors) so a one-line rebrand is possible. The Builder should match the reference
image's palette (dark sidebar gradient, accent for active states) and flag the chosen
hexes in the handoff summary so Raymon can confirm the brand color.

---

## 8. Definition of Done (what the Builder reports + what Build QA checks)

The Builder's handoff summary must include:
- Project path, how to run it, the two URLs (frontend, receiver).
- Which adapter mode was active during verification, and proof of both-mode
  persistence (§6.4 / §6.5).
- The `data/` files or Supabase rows produced by test events.
- Chosen brand hexes (for Raymon's confirmation).
- Any deviation from this spec (should be none) or open items.

Build QA (per `AGENTS.md` §6 QA + `.opencode/agent/qa-build.md`) verifies: frontend
renders with no broken components; endpoints return expected data with handled error
states; webhook events land in the store and show on the dashboard; timeframe filters
return correct §4.7 ranges; every persisted event has `event_type`, `client_id`,
`timestamp`, `payload`; dev-mode badge/banner behavior correct; no deployment step
(local-only). If a check cannot be performed, that is a fail.

---

## 9. Flags for the Leader / Raymon (open items, no assumptions made)

1. **Empty Supabase keys → dev-mode fallback is BY DESIGN** (§4.4/§4.5): the dashboard
   ships in local-file mode now and flips to Supabase when keys are added, with no UI
   change. This is the storage decision for this build.
2. **Exact GoHighLevel webhook payload shape is unknown.** n8n must normalize to the
   §4.2 envelope before forwarding. Ask Raymon for a captured GHL webhook payload
   sample to lock the normalization mapping in n8n.
3. **5th KPI card chosen: "Leads Qualified"** (`lead_qualified`), grounded in the
   discovery call's bulk-order qualification use case. Confirm this is the metric Raymon
   wants vs. "Avg Response Time" (the latter would need response-time data in payloads
   that is not currently specified).
4. **Brand color hex not provided** — Builder will match the reference image palette
   via `theme.ts` tokens and flag the chosen hexes for Raymon's confirmation.
5. **`GHL_WEBHOOK_SECRET` is empty** — receiver accepts unauthenticated POSTs in dev
   (with a startup warning). Production hardening (secret verification + HTTPS) is
   out of scope for this local-only build.
6. **Auth for Settings/users is out of scope** — add-people only; no login/roles
   enforcement in this build.
7. **Vision API was rate-limited** while inspecting the reference image; the spec
   therefore relies on the dashboard-builder skill's layout rules (text) + direct
   reference to the image files, which the Builder must open visually.
8. **No Vercel deployment** — per requirements this build is local-only; the Build QA
   "deployment" check is replaced by the §6 local-run verification.
