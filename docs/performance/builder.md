# Performance Log — Builder Agent

> Read this file BEFORE every task and follow every STANDARD below.

## Standards (always do)

- Build only from the QA-approved spec in `clients/<client-name>/build-spec/`.
- Every webhook event persisted with `event_type`, `client_id`, `timestamp`, `payload`.
- Never fabricate fallback data; errors fail loud.
- Portal/Notion work: keep the six-DB Notion model, query classic DBs with `2022-06-28`
  (data sources with `2025-09-03`), and store client PDFs only in Notion (no local
  `clients/<name>/documents/` folders).
- Numbers on client-facing sites come from Raymon or repo docs — **never** from the
  reference/competitor site (RJ's 50+/7/3x figures were explicitly forbidden).
- Spec placeholders render as "—" until Raymon supplies values; fill them **only** from
  Raymon's explicit words, never by borrowing or guessing.
- "Use the same" for copy means **verbatim (byte-faithful) reuse** of the approved line,
  not rephrasing.
- Label copy must match value semantics — when a value changes (e.g. 7 days → 2-4 weeks),
  re-check the label ("Days to go live" → "Time to go live") and flag it to Raymon
  so he can veto the label.

## Entries

### 2026-08-20 — LaunchOps portal (Notion-backed ops hub)

✅ **Reinforce** — Raymon: "the portal you built is amazing, I love the structure and the process."
- Portal is the single ops hub: overview with next-launch countdown, per-project roadmap,
  feedback, testimonials, and now a Documents tab backed by the Client Documents Notion DB.
- Keep the "Mission Control" tone (flight-deck labels, countdown language) and plain-language
  dates instead of jargon like "T-14".

📌 **Lesson** — Notion's file-upload send endpoint is **POST** `…/v1/file_uploads/{id}/send`
with multipart form-data and `Notion-Version: 2026-03-11`; PUT returns `400 invalid_request_url`.
Classic databases (created with `2022-06-28`) must be queried with that same version, not `2025-09-03`.

### 2026-09-16 — LaunchOps onboarding website build (stages: Infra spec → QA → Builder S1-S11 → Build QA conditional PASS)

Client: none (internal LaunchOps site, `onboarding-site/`)

✅ **Reinforce** (keep doing):
- **Placeholder handling** — stats the spec marked as placeholders (Average ROI, go-live
  timeline) were rendered as "—" instead of guessing values. This is exactly right:
  the spec said "awaiting Raymon," so the Builder kept them placeholders and waited.
- **Guardrails enforcement** — no RJ Media competitor figures (50+/7/3x) were borrowed for
  the landing stats; those were explicitly forbidden and the Builder respected that.
- **Exact subcopy application** — after Raymon approved reusing RJ Media's subcopy line
  ("Most businesses are still doing this manually. You're not. Let's get your project live -
  this takes 5 minutes."), it was applied byte-faithfully, not rephrased.
- **Label semantics** — when the go-live value became 2-4 weeks (not 7 days), the
  "Days to go live" label was adapted to "Time to go live" and flagged to Raymon in the
  breakdown so he can veto if he prefers different label copy.

❌ **Correct** (never repeat):
- None destructive this session. The mid-session corrections were Raymon supplying final
  values the spec had deliberately left as placeholders (Average ROI → **2-3x**, go-live → **2-4 weeks**);
  the Builder followed the placeholder rule correctly and the values are now incorporated.

📌 **Lesson / standard**:
- Spec placeholders get filled **only** from Raymon's explicit words — never from the
  reference site, never from competitor numbers. Numbers come from Raymon or repo docs.
- "Use the same" means verbatim reuse of the approved copy line, not paraphrasing.
- Verify label copy matches value semantics; any label adapted to fit a corrected value
  must be surfaced to Raymon in the breakdown for veto.
