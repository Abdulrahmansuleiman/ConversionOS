# LaunchOps Client Onboarding Website — Build Spec + Process Roadmap

> **Product:** `onboarding-site/` — a public, client-facing Next.js-style multi-step onboarding
> wizard and status page, modeled on the UX of <https://onboarding.rjmediahub.com/> and
> re-branded to **LaunchOps** (dark theme, amber accent, Notion-backed project creation).
>
> **Consumer of this spec:** Builder Agent. The Builder must read, in this order, before starting:
> 1. `AGENTS.md` (§1–§9 — operating rules, especially §5, §7.3, §9)
> 2. `docs/performance/infrastructure.md` and `docs/performance/builder.md` (Standards)
> 3. This spec
> 4. Reference code that this spec defers to (paths in §2 and §4 — all verified, do not re-derive):
>    - `launchops-portal/theme.ts`, `launchops-portal/server/*`, `launchops-portal/vercel.json`,
>      `launchops-portal/package.json`, `launchops-portal/vite.config.ts`,
>      `launchops-portal/notion-store.json`, `launchops-portal/public/launchops.svg`
> 5. `docs/playbooks/client-dashboard-build.md` — **only** for the Vercel/version-pinning patterns
>    (the webhook/Supabase content does NOT apply to this site; see §0).

---

## 0. Scope guard (what this site is NOT)

- This site is the **pre-build onboarding experience**. It is **not** the KPI dashboard and does
  **not** ingest GHL webhooks. There is **no Supabase, no `events` table, no webhook receiver**
  in this build (that pipeline is the Builder's dashboard work, tracked in
  `docs/playbooks/client-dashboard-build.md` — not here).
- Every piece of client data this site creates lives in **Notion** (LaunchOps HQ project store),
  persisted + timestamped by Notion itself (`created_time`).
- **No seed/sample data.** This site has no `seed` script, no sample rows, no prefilled forms.
  Every row it creates comes from a real form submission (see §6).

---

## 1. Reference summary — what RJ Media's onboarding site does (10 lines max)

Verified by fetching <https://onboarding.rjmediahub.com/> (Ground truth, 2026-09-16):

1. Landing page: logo header, "New client onboarding" pill, big hero headline, short subcopy.
2. Three stat cards under the hero ("Businesses scaled", "Days to go live", "Average ROI").
3. "What you'll get today" list with emoji checkmarks (Notion roadmap / account access / onboarding call).
4. "Start onboarding →" CTA leading into a multi-step form.
5. Multi-step wizard walks the client through details (name, email, phone, company…) with a
   progress indicator, one logical group per step.
6. Final step submits; on completion the client is told what happens next.
7. "Secured by … · All data encrypted" footer line.

**We preserve this exact UX flow. Everything else is re-branded to LaunchOps.** RJ's copy (headline,
stats figures 50+/7/3x, footer) is RJ Media's — it must NOT appear on the LaunchOps site (§6).

---

## 2. Tech stack + folder layout

### 2.1 Stack (match launchops-portal — pinned known-good versions from its `package.json`)

| Concern | Choice |
|---|---|
| Client | Vite `^6.3.5` + React `^19.2.8` + TypeScript `~5.7.2` |
| Styling | styled-components `^6.5.0` (same approach as portal) |
| Icons | react-icons `^5.7.0` |
| Routing | react-router-dom `^7` (new dep — this site has 3 real routes) |
| Backend | Express `^4.22.2`, dotenv `^17.4.2` (copy portal patterns) |
| Dev scripts | concurrently `^10.0.4` — `dev` runs client (5173) + backend (4100) |
| Build | `tsc -b && vite build` (solution-style tsconfig, same as portal/playbook) |
| Store | Notion via the portal's `notion.js` client (API version handling included — do not change it) |
| Deploy | Vercel, same `vercel.json` + `api/index.js` pattern as portal (§7) |

### 2.2 Dependency list (`package.json`)

```jsonc
"dependencies": {
  "dotenv": "^17.4.2",
  "express": "^4.22.2",
  "react": "^19.2.8",
  "react-dom": "^19.2.8",
  "react-icons": "^5.7.0",
  "react-router-dom": "^7",
  "styled-components": "^6.5.0"
},
"devDependencies": {
  "@types/react": "^19.1.2",
  "@types/react-dom": "^19.1.2",
  "@vitejs/plugin-react": "^4.4.1",
  "concurrently": "^10.0.4",
  "typescript": "~5.7.2",
  "vite": "^6.3.5"
}
```

Scripts: `dev` = `concurrently -k "npm:dev:client" "npm:dev:server"`, `dev:client` = `vite`,
`dev:server` = `node server/index.js`, `build` = `tsc -b && vite build`, `start` = `node server/index.js`,
`preview` = `vite preview`. **There is deliberately NO `seed` script.**

### 2.3 Folder layout (create exactly this tree)

```
onboarding-site/
├─ index.html                      # Google Fonts (Space Grotesk + Inter), title, favicon, meta
├─ package.json
├─ tsconfig.json                   # solution-style: { files: [], references: [app, node] }
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ vite.config.ts                  # port 5173; proxy /api → http://localhost:4100
├─ vercel.json                     # same as portal (buildCommand/outputDirectory/rewrites/functions)
├─ notion-store.json               # COPY of launchops-portal/notion-store.json (ids are NOT secrets)
├─ .env.example                    # NOTION_TOKEN= / ONBOARDING_PORT=4100  (values never committed)
├─ .gitignore                      # node_modules, dist, .env, data
├─ public/
│  └─ launchops.svg                # COPY of launchops-portal/public/launchops.svg
├─ api/
│  └─ index.js                     # Vercel serverless entry — `export default app;` (copy portal)
├─ server/
│  ├─ config.js                    # adapt portal's: loads repo-root .env + local .env;
│  │                               # ONBOARDING_PORT default 4100; NOTION_TOKEN; VERCEL guard
│  ├─ notion.js                    # COPY verbatim from launchops-portal/server/notion.js
│  ├─ schemas.js                   # COPY verbatim from launchops-portal/server/schemas.js
│  ├─ onboarding.js                # NEW: slugify, slug→latest-project lookup, onboard orchestration
│  ├─ routes.js                    # buildRoutes(): /health, /onboard, /status/:clientSlug (NO auth)
│  ├─ app.js                       # createApp() without portal auth (site is public)
│  └─ index.js                     # local runner on 4100
└─ src/
   ├─ main.tsx                     # router setup
   ├─ App.tsx                      # <Routes>: / , /onboard, /status/:clientSlug, * → 404
   ├─ theme.ts                     # COPY LaunchOps tokens from launchops-portal/src/theme.ts
   ├─ styles.ts                    # global styled-components (body bg, fonts, focus rings)
   ├─ content/
   │  ├─ stats.ts                  # landing stats — placeholders flagged (see §6.2)
   │  ├─ options.ts                # industry list, team size list, agent types list
   │  └─ copy.ts                   # all visible copy strings (single source, easy review)
   ├─ lib/
   │  ├─ validate.ts               # field validators shared client+server shape
   │  └─ api.ts                    # fetch wrapper (timeout, error parsing, retry support)
   ├─ components/
   │  ├─ Logo.tsx                  # launchops.svg mark + "LAUNCHOPS" wordmark
   │  ├─ Pill.tsx  Card.tsx  Button.tsx  Field.tsx  StatCard.tsx
   │  ├─ StepIndicator.tsx         # wizard progress (4 steps)
   │  ├─ StatusBadge.tsx           # Complete / In progress / Not started / Blocked
   │  └─ ErrorBanner.tsx           # visible error + Retry (never silent)
   └─ pages/
      ├─ LandingPage.tsx
      ├─ OnboardPage.tsx           # 4-step wizard + completion screen
      └─ StatusPage.tsx            # /status/:clientSlug
```

### 2.4 Key config values

- **Dev ports:** Vite 5173 · backend **4100** (`ONBOARDING_PORT`). Vite proxy:
  ```ts
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:4100', changeOrigin: true } } }
  ```
- **Google Fonts** (index.html): Space Grotesk (400,500,600,700) + Inter (400,500,600).
- **`<title>`:** "LaunchOps — New client onboarding". **Meta theme-color:** `#0A0E17`.
  **Favicon:** `/launchops.svg`.
- **`config.js`** — identical guard to the portal: if `process.env.VERCEL === '1'` and
  `NOTION_TOKEN` is empty, **throw loudly** (never serve a silently-broken backend).

---

## 3. Brand (LaunchOps tokens — canonical, from `launchops-portal/src/theme.ts`)

| Token | Value |
|---|---|
| `bg` | `#0A0E17` |
| `surface` / `surface2` | `#111A2B` / `#0D1522` |
| `border` / `borderSoft` | `#243047` / `#1B2740` |
| `text` / `textMuted` / `textFaint` | `#EAF1F9` / `#8B96AC` / `#5B6787` |
| `accent` / `accentSoft` | `#FFB43A` / `rgba(255,180,58,0.14)` — **amber, not lime** |
| `accent2` | `#4CC9F0` (secondary accent only) |
| `positive` / `negative` | `#34D399` / `#F87171` |
| Display font | Space Grotesk (`theme.fonts.display`) |
| Body font | Inter (`theme.fonts.body`) |
| Radii / shadows | `sm 8, md 12, lg 18`; `theme.shadows.card/hover/glow` from the portal |

**Logo:** `Logo` component (Space Grotesk 600, letter-spacing ~0.12em) rendering the wordmark
**"LAUNCHOPS"** in `text` with a single accent glyph or an amber dot after the word (Builder picks
the minimal variant and notes it in the handoff). Mark: `public/launchops.svg` (copied from portal)
at 28–32px. ⚠️ That SVG is currently purple/indigo — reuse as-is; **do not re-tint without Raymon's
ok** (flagged in §8). Nav/headers use the wordmark; the status page uses wordmark + "Client" suffix.

---

## 4. Page-by-page UI spec

### 4.1 `/` — Landing page

Layout, top to bottom (identical UX to RJ's, LaunchOps branding):

1. **Header:** wordmark logo (left). No nav links.
2. **Eyebrow pill:** `New client onboarding` — pill with `accentSoft` bg, `accent` text,
   `border` stroke, uppercase mono or Inter 600, radius `999px`.
3. **Headline** (Space Grotesk, ~56–64px, `text`): placeholder copy —
   *"Meet your AI agent, faster."* → flag to Raymon for final copy (§8). Subcopy (Inter, `textMuted`):
   *"Most teams lose leads in the follow-up. LaunchOps builds your conversational AI agent and
   ships it with a roadmap, a dashboard, and a team that answers. Onboarding takes 5 minutes."*
   (placeholder copy, same flag).
4. **3 stat cards** — values come **only** from `src/content/stats.ts` (see §6.2 for the
   placeholder rule). Card: `surface` bg, `border` stroke, `lg` radius, `shadows.card`.
5. **"What you'll get today"** — list with emoji checkmarks (copy from `content/copy.ts`):
   - 📋 Your personal Notion project workspace (roadmap)
   - 🔑 Dashboard access for your build
   - 📞 Onboarding call with the team
6. **"Start onboarding →"** CTA — `accent` bg, `#0A0E17` text, `md` radius, points to `/onboard`.
   On hover: `shadows.hover`.
7. **Footer:** `Secured by LaunchOps · All data encrypted` (`textFaint`, 12px).

Empty states / errors: stats with `value: null` render **"—"** (never a guessed number, §6.2).

### 4.2 `/onboard` — Multi-step wizard

**Shell:** centered column (max ~560px), card `surface` + `border` + `lg` radius + `shadows.card`.
**Progress indicator** (`StepIndicator`): 4 labeled steps — `Contact` · `Company` · `Project` ·
`Review` — filled dots/segments in `accent` for visited/current, `border` for upcoming; numeric
labels. Back button (ghost) always visible after step 1; Next/Submit primary button.

Client-side state: single `form` object held in `OnboardPage` (no persistence layer — refreshing
mid-way restarts; acceptable, note in completion copy not required). The wizard stores **only what
the client types** — no defaults, no prefilled values, no sample data.

**Step 1 — Contact** (fields):
| Field | Type | Required | Validation |
|---|---|---|---|
| Full name | text | ✅ | 2–120 chars after trim |
| Email | email | ✅ | `^[^\s@]+@[^\s@]+\.[^\s@]+$` (basic) |
| Phone | tel | ✅ | strip non-digits → 7–15 digits (allow `+ ( ) - .` and spaces in input) |

**Step 2 — Company**:
| Field | Type | Required | Validation |
|---|---|---|---|
| Company name | text | ❌ (falls back to full name, §5.3) | if present: 2–120 chars |
| Website | url | ❌ | if present: must parse as `http(s)://` URL |
| Industry | select | ✅ | from `content/options.ts` list |
| Team size | select | ✅ | from list: `1`, `2–5`, `6–10`, `11–25`, `26–50`, `50+` |

**Step 3 — Project**:
| Field | Type | Required | Validation |
|---|---|---|---|
| What should we build? (agent type) | select | ✅ | `AI Intro Message Agent` / `AI Conversation Agent` / `AI Follow Up Agent` / `Full ConversionOS` (labels mirror AGENTS.md §7.1) |
| Main goal | textarea | ✅ | 10–2000 chars |
| Current process | textarea | ✅ | 10–2000 chars |
| Anything else we should know? | textarea | ❌ | ≤2000 chars |

Validation UX: on Next, validate the step; invalid fields show inline `negative`-color messages +
`border` → `negative` on the offending input; focus the first invalid field. Valid → advance.

**Step 4 — Review:** read-only summary of all answers grouped by step, each group headed by an
`Edit` button (accent link) that jumps back to that step (state preserved). Submit button label:
`Submit onboarding`. Disabled + `Submitting…` while the POST is in flight (no double-submit).

**Completion screen (same route, after success):** success state — green check icon `positive`,
headline *"You're in. Your project is queued."*, body listing exactly the confirmed next steps
(from `content/copy.ts` + `statusUrl`): (1) your Notion workspace/roadmap is being prepared,
(2) an onboarding call with the team, (3) your build dashboard goes live. Primary CTA:
**"View your onboarding status →"** → `/status/<clientSlug>`. Secondary: back to home.
**Error state:** `ErrorBanner` with the server's `{ error }` message + Retry button; **never**
render success unless the API returned `ok: true` (§6.3).

### 4.3 `/status/:clientSlug` — Client status page

- On mount: `GET /api/status/:clientSlug` (client resolves relative `statusUrl` against
  `window.location.origin`).
- **Success:** card `surface`/`border`. **"Welcome, [Client name] 👋"** (Space Grotesk) — Client
  name = project's Client title — plus **"Your onboarding journey"** heading.
  **Phase progress list** — the 6 canonical phases in order (from portal `PHASES`):
  `Kickoff → Design → Build → Review → Launch → Post-launch support`, each row:
  phase name + `StatusBadge` (Complete `positive` / In progress `accent` / Not started `textFaint` /
  Blocked `negative` — map from `theme.ts` `phaseStatusColor`), connected by a vertical timeline
  (completed = filled accent line).
  **"What you'll get next":** onboarding call with the team · your build dashboard goes live.
- **404** (`ok:false`): friendly card — *"We couldn't find an onboarding for this link."* + CTA
  `Start onboarding →`. 
- **Network/5xx:** `ErrorBanner` + Retry (§6.3). No fabricated fallback content.

### 4.4 `*` — 404 page

Minimal centered card: *"Page not found."* + link home. (No invention, no fake links.)

---

## 5. Backend API spec

### 5.1 Server composition (reuse the portal's exact patterns)

- `server/notion.js` — **copy verbatim** from the portal. It already handles the API-version
  split: classic DB queries use `2022-06-28`, row creation uses `2025-09-03`, and it reads the
  copied `onboarding-site/notion-store.json` relative to its own folder. **Do not modify versions,
  normalize, or `encodeProps`.** Do not add a `dataSources` key to the store (the store has none).
- `server/schemas.js` — **copy verbatim** (all six DB maps; the Builder uses `Projects`, `Roadmap`,
  and `Client Feedback` definitions).
- `server/config.js` — adapt portal's: `ONBOARDING_PORT` (default `4100`), `NOTION_TOKEN`,
  repo-root `.env` then local `.env`, VERCEL guard (throw when `VERCEL === '1'` and token empty).
- `server/app.js` — like the portal's but **without `loginRouter`/`requireAuth`** (this is a public
  client site). Keep: `express.json({ limit: '1mb' })`, `GET /api/health`
  (`{ ok, mode: 'notion', bot, configured }` via `n.health()`), route mount, and the
  `404 { error: 'not found' }` catch-all under `/api`.
- `server/index.js` — local runner: `app.listen(cfg.port)` → log
  `http://localhost:<port>/api/health`.
- `api/index.js` + `vercel.json` — copy the portal's (rewrites `/api/(.*)` → `/api/index`,
  `/(.*)` → `/index.html`, `functions.api/index.js.maxDuration = 30`).

### 5.2 `POST /api/onboard` — submit onboarding (idempotent-per-request)

Request (`application/json`):
```jsonc
{
  "fullName": "Ada Lovelace",          // required, 2–120
  "email": "ada@example.com",          // required, basic email
  "phone": "+44 7911 123456",          // required, 7–15 digits after strip
  "company": "Analytical Engines",     // optional, 2–120
  "website": "https://…",              // optional, http(s) URL if present
  "industry": "Software",              // required, from options list
  "teamSize": "11–25",                 // required, from options list
  "agentType": "AI Conversation Agent",// required, from the 4 ConversionOS labels
  "mainGoal": "…",                     // required, 10–2000
  "currentProcess": "…",               // required, 10–2000
  "anythingElse": ""                   // optional, ≤2000
}
```

Behaviour — the server **re-validates every field** (never trusts the client). On validation
failure: `400 { ok:false, error:"<first problem>", fields: { <field>: "<reason>" } }`.

On success, in order (see §5.4 for the atomicity/compensation rule):

**a. Create the project row** (Database `Projects`, schema from `schemas.js`):

| Notion prop (type) | Value |
|---|---|
| `Client` (title) | `company` trimmed; if absent, `fullName` |
| `Status` (select) | `In Discovery` |
| `Industry` (rich_text) | wizard `industry` |
| `AI Persona` (rich_text) | wizard `agentType` (verbatim label) |
| `Notes` (rich_text) | `[Onboarded via onboarding site] Goal: … | Current process: … | Other: …` (omit the `Other:` part when empty) |
| `KPIs`, `Dashboard URL`, `Repo URL`, `Kickoff Date`, `Launch Date` | **not set** (omit — `encodeProps` skips undefined) |

**b. Create the 6 roadmap milestones** (Database `Roadmap`), one per canonical phase:

| Notion prop (type) | Value |
|---|---|
| `Milestone` (title) | phase name (e.g. `Kickoff`) |
| `Project` (relation) | `[<newProjectRowId>]` |
| `Phase` (select) | phase name |
| `Status` (select) | `Kickoff` → `In progress`; all others → `Not started` |
| `Due Date`, `Notes` | not set (omit) |

**c. (OPTIONAL — deferred, see §8)** Create the client feedback form page in `Client Feedback`.

**d. Response** `201`:
```jsonc
{
  "ok": true,
  "projectId": "<notion page id>",
  "clientSlug": "analytical-engines",
  "statusUrl": "/status/analytical-engines",
  "projectName": "Analytical Engines"
}
```

**Slug rule (§5.3).** Duplicate submissions are allowed to create new project rows (idempotency is
per-request, not per-client); the status page resolves the **latest** row for a slug (§5.5).

### 5.3 Slug derivation — `server/onboarding.js` (new file)

```ts
export function slugify(name: string): string {
  const s = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return s.length ? s : `client-${shortId}`; // shortId = first 8 chars of the new project row id
}
```
- Slug uses `company` when present, else `fullName`. Implement in `onboarding.js` and expose
  `slugify`, `findLatestProjectBySlug`, and `createProjectWithRoadmap`.

### 5.4 Atomicity + compensation (non-negotiable)

1. Create the project row. If it fails → `500 { ok:false, error }`, nothing else attempted.
2. Create the 6 roadmap rows with `Promise.allSettled`. If **any** roadmap create fails:
   - attempt to **archive** every successfully created row (`PATCH /v1/pages/:id { archived: true }`
     — Notion rows cannot be deleted via API) **and** the project row;
   - return `500 { ok:false, error, partialProjectId }` so an operator can verify cleanup.
3. Never return success when any part failed. Never retry a mutation automatically inside the
   request (a retry could duplicate rows) — the client's Retry button is the retry path, and
   duplicate rows are an accepted, resolvable outcome per §5.2.

### 5.5 `GET /api/status/:clientSlug`

`findLatestProjectBySlug(slug)`:
1. `n.queryDatabase('Projects')` (raw results; the portal already paginates 100 — fine for LaunchOps scale).
2. For each raw row compute `rowSlug = slugify(normalized Client title)`; keep matches.
3. Sort matches by **`created_time` descending** (read `row.created_time` from raw results —
   `normalize()` doesn't map it) and take the first → **latest project for the slug.**
4. Fetch its milestones: `n.listRows('Roadmap', { filter: { property: 'Project', relation: { contains: id } } })`
   sorted by the canonical `PHASE_ORDER` (from portal `theme.ts`), then `Due Date`.

Response `200`:
```jsonc
{
  "ok": true,
  "project": { "id": "…", "client": "Analytical Engines", "status": "In Discovery",
               "industry": "Software", "aiPersona": "AI Conversation Agent",
               "notes": "[Onboarded via onboarding site] …", "createdAt": "<ISO created_time>" },
  "milestones": [
    { "id": "…", "milestone": "Kickoff", "phase": "Kickoff", "status": "In progress" },
    { "id": "…", "milestone": "Design", "phase": "Design", "status": "Not started" }
    // …6 rows, PHASE_ORDER
  ]
}
```
No match → `404 { ok:false, error:"Onboarding not found for this link." }`. Notion failure →
`500 { ok:false, error }`.

### 5.6 Routes summary

| Method + path | Success | Failure |
|---|---|---|
| `GET /api/health` | `200 { ok, mode:'notion', bot, configured }` | `503 { ok:false, error }` |
| `POST /api/onboard` | `201` (shape §5.2d) | `400` validation / `500` Notion (+ `partialProjectId` on partial-failure) |
| `GET /api/status/:clientSlug` | `200` (shape §5.5) | `404` no match / `500` Notion |
| anything under `/api` | — | `404 { error:'not found' }` |

---

## 6. Anti-hallucination + error-handling rules (specific, binding)

These are grounding rules for the Builder, written per the `prompt-engineer` skill patterns. They
override convenience. Violations fail Build QA.

### 6.1 Grounding rules

1. **The only source of client data is the form.** The wizard stores exactly what the client
   types. No prefilling, no defaults, no sample rows, no seed script, no demo mode in the
   delivered site. Test submissions use the exact marker `QA TEST` in the company/name field and
   are **archived after verification** (§7.4).
2. **No invented stats.** Landing stat values come **only** from `src/content/stats.ts`. The three
   labels are `Businesses scaled`, `Days to go live`, `Average ROI`. Values are **placeholders
   awaiting Raymon** (see §6.2). RJ Media's figures (50+, 7 days, 3x) are the competitor's —
   **never** copy them, never substitute them, never "improve" them with estimates.
3. **No invented Notion schema.** Property names/types come **only** from `server/schemas.js`
   (copied verbatim — canonical). Phases come **only** from the portal's `PHASES` constant. If a
   property appears to be missing, **stop and ask the Leader** — do not add properties.
4. **No invented copy.** All visible strings live in `src/content/copy.ts` and the two placeholder
   hero strings flagged in §8. Do not add claims about outcomes, timelines, or pricing.
5. **No invented idempotency.** Duplicate-submit behavior is exactly §5.2/§5.5: new row each time,
   status page = latest row. Do not "dedupe" silently.
6. **Secrets stay in env.** `NOTION_TOKEN` is read from `process.env` only (via `config.js`).
   Never hardcode, log, or commit it. `.env.example` has keys with empty values only.
7. **Ambiguity → stop.** If any instruction here conflicts with a portal file, or a portal file
   referenced here is missing/different from this spec's description, **ask the Leader before
   proceeding.** Do not guess.

### 6.2 Landing stats — placeholder handling

`src/content/stats.ts`:
```ts
export type Stat = { label: string; value: number | null; unit?: string; confirmed: boolean };
export const stats: Stat[] = [
  { label: 'Businesses scaled', value: null, confirmed: false }, // PLACEHOLDER — Raymon to confirm
  { label: 'Days to go live',   value: null, confirmed: false },
  { label: 'Average ROI',       value: null, unit: 'x', confirmed: false },
];
```
UI rule: `value === null` renders **"—"**. Until Raymon confirms numbers, the live site honestly
shows placeholders, not invented figures. Raymon confirms → edit only this file. This is flagged
in the handoff (§8). (Grep of the repo found **no** verifiable LaunchOps aggregate figures as of
2026-09-16 — leadflow/bloomline facts are per-client contract facts, not LaunchOps marketing stats.)

### 6.3 Error handling (fail loud, never fake success)

- **Backend:** every route wraps in try/catch → HTTP error + `{ ok:false, error }`. Never log the
  token. On partial Notion failure: compensation (§5.4) + `partialProjectId` + clear message.
- **Frontend:** `lib/api.ts` fetch wrapper — 10s timeout, non-2xx → parse `{ error }` and throw a
  typed error; `ErrorBanner` shows the server's message verbatim with a **Retry** button; submit
  button disabled while in flight. Success UI renders **only** on `res.ok === true`.
- **Status page:** 404 → friendly "not found" card + CTA; network/5xx → `ErrorBanner` + Retry.
- **No silent fallbacks anywhere.** No cached/fake data, no "offline mode", no placeholder rows on
  the status page. If Notion is down, the client sees the failure.

---

## 7. Process roadmap — order of operations (Builder)

Each stage lists its **verification gate**; do not start a stage whose dependency is unverified.
(Numbers = dependency order. Even-numbered verification steps are explicit.)

1. **S1 — Scaffold.** Create `onboarding-site/` exactly per §2.3 (empty tree); `package.json` with
   pinned deps (§2.2); solution-style tsconfigs; `vite.config.ts` (5173 → proxy 4100); copy
   `notion-store.json`, `public/launchops.svg`; copy `server/notion.js`, `server/schemas.js`;
   copy `vercel.json` and `api/index.js`; write `config.js` (VCEREL guard, `ONBOARDING_PORT` 4100),
   `app.js` (no auth), `index.js`, **empty** `routes.js`/`onboarding.js` stubs; `.env.example`,
   `.gitignore`. `npm install`.
   **Verify:** `npm run dev` boots both processes (5173 + 4100) without errors; `GET /api/health`
   (from a temporary route) returns 200 with `configured: true` **only if** repo-root `.env`
   contains `NOTION_TOKEN` (read-only check; never print the token). If `.env` has no token, record
   it in the handoff (§8) — do not fake it.

2. **S2 — Theme + shell.** `src/theme.ts` (copy portal tokens), `styles.ts`, `index.html`
   (fonts/title/favicon/meta), `Logo`, `App.tsx` routing with placeholder pages for the 3 routes.
   **Verify:** `npm run build` (`tsc -b && vite build`) is green; each route renders the shell;
   colors match §3 exactly (amber `#FFB43A` accent, bg `#0A0E17`).

3. **S3 — Landing.** `content/copy.ts`, `content/stats.ts` (§6.2), `LandingPage` per §4.1,
   `StatCard`, `Pill`, `Button`.
   **Verify:** renders with LaunchOps branding; stat values come from `stats.ts` (null → "—");
   `Start onboarding →` navigates to `/onboard`; **no** RJ Media copy/figures present (grep:
   "top 1%", "50+", "3x" must return nothing in `src/`).

4. **S4 — Wizard.** `OnboardPage`, `StepIndicator`, `Field`, `validate.ts`, review step with edit
   buttons, completion/error states per §4.2. State holds only typed values.
   **Verify:** each step blocks Next on invalid input with inline errors; review shows the exact
   typed values; edit jumps back preserving state; submit disabled while in flight; no sample
   values anywhere (grep `src/` for `placeholder=` on inputs — only literature placeholders in
   `copy.ts` if any).

5. **S5 — Backend core.** Implement `routes.js` (`/health`), `onboarding.js`
   (`slugify`, `findLatestProjectBySlug`), `app.js` wiring.
   **Verify:** `GET /api/health` 200; `slugify("Analytical Engines") === "analytical-engines"`;
   slug edge cases (`Acme Corp!` → `acme-corp`, `"  "` → `client-<shortId>` fallback).

6. **S6 — Onboard endpoint.** `POST /api/onboard` per §5.2–§5.4 (validation, project create,
   6 milestone creates, compensation, `201` shape).
   **Verify (live Notion, test data marked `QA TEST`):** (a) POST a full valid payload →
   `201` with correct slug; (b) Inspect Notion: project row exists, `Status=In Discovery`,
   `AI Persona` = verbatim agentType, `Notes` prefixed `[Onboarded via onboarding site]`, 6
   milestone rows related to it with `Kickoff=In progress`, rest `Not started`; (c) invalid payload
   → `400` with field errors; (d) POST twice → two rows (`201` both); (e) kill `NOTION_TOKEN` in
   the environment → `500 { ok:false, error }` (restore token after).

7. **S7 — Status endpoint + page.** `GET /api/status/:clientSlug` (latest-lookup §5.5) +
   `StatusPage` per §4.3 (`StatusBadge`, timeline, 404, error+retry).
   **Verify:** returns the **latest** of the two test rows from S6(d) with milestones in
   `PHASE_ORDER`; unknown slug → 404; UI shows `Welcome, QA TEST…` (then archive test rows, §7.4);
   frontend resolves `statusUrl` against `window.location.origin`.

8. **S8 — Error-state sweep.** Recheck every async path: submit failure, status 404, status 5xx,
   network timeout. All must render `ErrorBanner` + Retry, none fake success.
   **Verify:** with the token killed, both pages show visible errors and recover on Retry after the
   token is restored. (Manual check; document in handoff.)

9. **S9 — Full local verify + build.** End-to-end walkthrough of the whole flow in dev (landing →
   wizard → submit → status). `npm run build` green.
   **Verify:** complete flow works against real Notion with `QA TEST` data; `dist/` builds clean.
   **Then archive all `QA TEST` rows** (PATCH archived — Builder does it via a one-off script or
   asks Raymon to archive in the Notion UI; document which rows).

10. **S10 — Deploy to Vercel.** Same repo rules as the playbook: `git init`, commit **(no `.env`,
    no `node_modules`, no `dist`)**; push to GitHub. If a linked Vercel project + `VERCEL_TOKEN`
    are available: `vercel deploy --prod` (env `NOTION_TOKEN` must already be set in the Vercel
    project, or `vercel env add NOTION_TOKEN production` — value pasted from repo-root `.env`,
    never echoed to logs). If **not** available: **stop and flag to Raymon** (§8) — do not invent
    a deployment, do not skip verification.
    **Verify (post-deploy):** live URL `GET /api/health` → `{ ok:true, mode:'notion', configured:true }`;
    live landing loads; one real POST through the live URL → 201; status page resolves; then
    archive that test row. Clean state for the first real client.

11. **S11 — Handoff + commit.** QA-Build signs off; commit the final tree with a concise message;
    produce the Builder breakdown (AGENTS.md §8) plus the §8 flags list.

**Dependency map:** S2←S1 · S3←S2 · S4←S2 · S5←S1 · S6←S5 · S7←S5+S6 · S8←S6+S7 ·
S9←S3+S4+S6+S7+S8 · S10←S9 · S11←S10. Nothing depends on a later stage.

---

## 8. Deployment plan + flags for Raymon

### 8.1 Env vars

| Var | Where | Notes |
|---|---|---|
| `NOTION_TOKEN` | repo-root `.env` (exists already) + Vercel production env | Required. Never committed. |
| `ONBOARDING_PORT` | local only (default `4100`) | Vercel ignores it. |
| `VERCEL_TOKEN` | local env, optional | If absent → deployment is handed to Raymon (S10). |

### 8.2 Vercel

Same shape as the portal: `vercel.json` rewrites, `api/index.js` single serverless function,
`NOTION_TOKEN` set in the project env, `VERCEL === '1'` guard active. Custom
`<name>.launchops.click` subdomain is a **later** option (playbook §Phase 6) — not in this build.

### 8.3 Flags for Raymon (delivered in the handoff — do not resolve silently)

1. **Landing stat numbers (BLOCKER for live polish, not for launch):** `Businesses scaled`,
   `Days to go live`, `Average ROI` currently render "—" until Raymon supplies real LaunchOps
   figures. Editing `src/content/stats.ts` is the only change needed.
2. **Hero headline + subcopy** are placeholder drafts (flagged in §4.1) — Raymon to approve or
   replace in `src/content/copy.ts`.
3. **`NOTION_TOKEN` presence check** — Builder confirms it exists in repo-root `.env` before
   backend verification; if missing, backend verification is blocked and reported.
4. **`VERCEL_TOKEN` / linked Vercel project** — absent ⇒ Builder stops at S10 and hands the repo
   to Raymon to import + set `NOTION_TOKEN`; absent ⇒ no deployment is claimed.
5. **Feedback-form step (5.2c) deferred:** the `notion-project-store` skill is **not installed**
   in `.opencode/.agents/skills` (verified), so the exact Client-Feedback-form-creation pattern
   can't be sourced. This feature is OPTIONAL/recommended-later; the portal's existing feedback
   workflow already covers clients. Builder ships `POST /api/onboard/:projectId/feedback-form` as
   an explicit `501 { ok:false, error:'not implemented — see BUILD_SPEC §8.3.5' }` stub. **Do not
   improvise the Notion feedback-form flow without the skill or Raymon's pattern.**
6. **Logo:** `public/launchops.svg` is purple/indigo — reused as-is pending Raymon's word on
   whether to re-tint it amber.

### 8.4 Data requirements (what must exist before the build is "done")

- Notion store file copied and queryable with the token (§S1).
- Repository-root `.env` with `NOTION_TOKEN` (read-only check).
- No dashboard/webhook data is required for this site — none is consumed (§0).

---

## 9. Sources (verified against repo, 2026-09-16)

| Fact | Source |
|---|---|
| LaunchOps theme tokens, `PHASES`, `phaseStatusColor`, shadows/fonts | `launchops-portal/src/theme.ts` |
| Notion DB ids + `pageId` (not secrets) | `launchops-portal/notion-store.json` = `docs/notion-store.json` |
| Notion client + API version split (query `2022-06-28` classic / create `2025-09-03`) | `launchops-portal/server/notion.js` |
| Projects/Roadmap/Client Feedback property maps | `launchops-portal/server/schemas.js` |
| Portal server composition + VERCEL guard + env loading | `launchops-portal/server/{config,app,index,routes}.js` |
| Vercel wiring | `launchops-portal/vercel.json`, `launchops-portal/api/index.js` |
| Version pins (react/express/styled-components/vite/ts) | `launchops-portal/package.json` |
| ConversionOS agent-type labels + workflow reality | `AGENTS.md` §7.1, `docs/playbooks/client-dashboard-build.md` |
| Reference site UX + RJ copy (do-not-copy) | fetched <https://onboarding.rjmediahub.com/> |
| Per-client facts (NOT LaunchOps aggregate stats) | `clients/{leadflow,bloomline-apparel}/facts.json` |
| Notion row lifecycle (archive, not delete) | Builder lesson, `docs/performance/builder.md` |