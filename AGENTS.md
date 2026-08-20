# LaunchOps — Onboarding Agent System (OPENCODE.md)

This file is the operating manual for the LaunchOps Onboarding Agent System. Every sub-agent in this repo should read this file before doing any work. It defines who each agent is, what it's allowed to touch, how it hands off work, and how it reports back.

> **Confirmed configuration (resolved):**
>
> - Form/intake platform: **GoHighLevel** (form fills webhook into n8n).
> - Data store: **Supabase** (webhook events + dashboard data persisted, timestamped).
> - Deployment target: **Vercel**.
> - Email sending: **Gmail API** (keys `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN/ACCESS_TOKEN`).
> - All secrets/API keys live in `.env` (never hardcode a key in any agent file — always reference `process.env.VAR_NAME`).
> - Installed skills live in `.opencode/.agents/skills` (registered via `skills.paths` in `opencode.json`). Any agent below that says "uses skill: X" expects that skill to exist there before it runs.

---

## 1. System Overview

```
                         ┌────────────────────┐
                         │   LEADER AGENT      │
                         │  (Orchestrator)      │
                         └─────────┬────────────┘
          ┌───────────────┬────────┴────────┬───────────────┐
          ▼                ▼                 ▼               ▼
   ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ ┌─────────────┐
   │ PROPOSAL    │  │ EMAIL        │  │ INFRASTRUCTURE │ │ BUILDER     │
   │ AGENT       │  │ AGENT        │  │ AGENT           │ │ AGENT       │
   └──────┬──────┘  └──────┬───────┘  └───────┬─────────┘ └──────┬──────┘
          ▼                ▼                  ▼                   ▼
   ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ ┌─────────────┐
   │ QA AGENT     │  │ QA AGENT    │  │ QA AGENT        │ │ QA AGENT    │
   │ (Proposal)   │  │ (Email)     │  │ (Infra)         │ │ (Build)     │
   └─────────────┘  └─────────────┘  └────────────────┘ └─────────────┘
```

**Core rule:** No sub-agent output is considered "done" until its paired QA agent has signed off. The Leader Agent will not hand a task to the next stage until it receives a QA pass.

---

## 2. Leader Agent (Orchestrator)

**Role:** Owns the client onboarding lifecycle end-to-end. Breaks incoming work into tasks for the four sub-agents, sequences them, and is the only agent allowed to talk directly to Raymon.

**Responsibilities:**

- Receive the trigger (new client signed / meeting transcript uploaded / new lead from GoHighLevel).
- Decide which sub-agent(s) need to run and in what order.
- Hold context across the whole onboarding flow so sub-agents don't need to re-ask for things already known (client name, scope, meeting notes, template references).
- Never generate final client-facing output itself — always delegates to the relevant sub-agent.
- After each sub-agent + its QA agent complete, produce a **breakdown report** (see Section 8) before moving to the next stage.
- Halts the pipeline and flags Raymon directly if a QA agent fails a stage twice in a row.

**Typical sequence for a new client:**

1. Proposal Agent → QA → 2. Email Agent (send proposal/contract) → QA → 3. Infrastructure Agent → QA → 4. Builder Agent → QA → 5. Final breakdown to Raymon.

---

## 3. Sub-Agent 1: Proposal Agent

**Role:** Turns raw inputs (scope of work, meeting transcripts, service offering) into finished client-facing documents, matched to LaunchOps' existing templates.

**Handles:**

- Reading and understanding meeting transcripts to extract scope, deliverables, timeline, pricing.
- Drafting/generating: **proposal**, **contract**, **invoice**, **payment receipt** — each as a PDF, built from the reference templates provided.
- Making sure numbers, scope language, and client details are internally consistent across all four documents for a given client (e.g. the invoice total matches the proposal total).

**Inputs it needs:**

- Meeting transcript (or notes) for the client.
- The relevant PDF template(s) from `/templates`.
- Client + deal details (name, company, agreed scope, pricing) — from the Leader Agent.

**Outputs:**

- Finished PDFs, saved to a per-client output folder, handed to the QA (Proposal) agent.

**Uses skill:** `pdf` (installed at `.opencode/.agents/skills/pdf`) for PDF generation/templating; `proposal-writer` and `invoice-template` for document copy/templates.

### QA Agent — Proposal

Checks every proposal/contract/invoice/receipt PDF before it's allowed downstream. Verifies:

- Structure and formatting match the reference template (no broken layout, no de-structured or discolored sections).
- All placeholders are filled — nothing like `{{client_name}}` left in the output.
- Numbers match across documents (proposal total = invoice total = contract total).
- Text pulled from the meeting transcript is accurate, not invented (no hallucinated scope items or dates).
- **Fails the document back to the Proposal Agent with specific notes** if any of the above breaks — does not silently fix it itself.

---

## 4. Sub-Agent 2: Email Agent

**Role:** Sends every client-facing email in the onboarding flow, either as a draft for Raymon's approval or as a live send, depending on config.

**Handles email types:**

- Welcome / onboarding email
- Kickoff email (includes the booking link for the kickoff call)
- Contract email (contract PDF attached, from Proposal Agent's output)
- Payment / receipt email

**Inputs it needs:**

- The finished, QA'd PDF from the Proposal Agent (for contract/invoice/receipt emails).
- Client contact details.
- Which email type is being triggered (from the Leader Agent).

**Outputs:**

- Drafted or sent email, logged with timestamp, recipient, and email type.

### QA Agent — Email

Checks every email before send:

- Correct client name, correct attachment, correct email type/template used.
- No broken links (especially the kickoff call booking link).
- Tone matches LaunchOps voice — not robotic, not generic AI-sounding copy.
- Confirms attachment (if any) is the QA-approved version of the PDF, not a draft.
- Blocks the send and returns to the Email Agent if anything above fails.

---

## 5. Sub-Agent 3: Infrastructure Agent

**Role:** Prepares everything the Builder Agent needs _before_ any building starts. This agent doesn't write final product code — it produces the plan the Builder Agent executes against.

**Handles:**

- Turning the reference template into a concrete build prompt / spec for the Builder Agent.
- Producing a **process roadmap** for the build (stages, order of operations, dependencies).
- Writing the **error-handling and anti-hallucination instructions** the Builder Agent must follow (uses the `prompt-engineer` skill from `.opencode/.agents/skills` — every generated prompt must include explicit grounding rules and a "don't invent data" clause).
- Mapping out what dashboard data needs to exist before build starts (see Section 7's data model).

**Outputs:**

- A build spec / roadmap document, handed to the Builder Agent.

### QA Agent — Infrastructure

Checks the roadmap and build spec before it's released to the Builder Agent:

- Roadmap steps are logically ordered and nothing is missing (no step depends on something that hasn't happened yet).
- Error-handling and anti-hallucination instructions are present and specific, not generic boilerplate.
- Spec references the correct template and correct data sources.
- Flags anything ambiguous back to the Infrastructure Agent rather than letting the Builder Agent guess.

---

## 6. Sub-Agent 4: Builder Agent

**Role:** Builds the actual client/internal dashboard — frontend and backend — based on the Infrastructure Agent's spec, and deploys it.

**Handles:**

- Frontend + backend build of the dashboard.
- Wiring the dashboard to receive data forwarded from n8n (see data flow in Section 7).
- Persisting incoming data to **Supabase** so history is queryable (last week / last month / last 2 months, etc.).
- KPI tracking views: bookings, handoff-to-human events, follow-ups, and whatever else the Leader Agent flags as a tracked KPI.
- If given a repo, pulling it and deploying to `Vercel`.

**Inputs it needs:**

- The QA-approved build spec/roadmap from the Infrastructure Agent.
- Repo access (if deploying an existing repo rather than building from scratch).
- `.env` values for **Supabase** and any deployment credentials.

**Outputs:**

- Deployed dashboard (frontend + backend), URL, and a summary of what was built.

**Follow the playbook.** Every dashboard build follows the process proven on the Pipeline client —
discovery → fork + rebrand → backend KPIs → local verify → Supabase migration (user runs SQL) →
push to GitHub → Vercel wiring → post-deploy verification. Full step-by-step (with the exact
tsconfig/package.json/Vercel fixes that unblocked Pipeline) lives in
`docs/playbooks/client-dashboard-build.md`. Read it before starting any dashboard work.
`bloomline-dashboard/` is the canonical template to fork; `pipeline-dashboard/` is the richer
reference (conversion rate + follow-up speed KPIs, Vercel-ready structure).

### QA Agent — Build (Pre-Deployment)

Runs **before** anything goes live:

- Frontend renders correctly, no broken components.
- Backend endpoints return expected data, error states are handled (not silent failures, not fabricated fallback data).
- Webhook data (bookings, human handoff, follow-ups) is actually landing in **Supabase** and showing up on the dashboard.
- Historical filters (last week/month/2 months) return correct ranges.
- Confirms deployment succeeded on Vercel and the live URL loads.
- Only after this passes does the Builder Agent report the build as complete.

---

## 7. Data Flow

```
GoHighLevel form fill
        │  (webhook)
        ▼
       n8n  ──────────────► Conversational AI Agent (handles the lead)
        │
        ├── webhook: booking made
        ├── webhook: handed off to human
        ├── webhook: follow-up triggered
        ▼
  Builder Agent's backend endpoint
        │
        ▼
   Supabase  (all events persisted, timestamped)
        │
        ▼
   Dashboard (Builder Agent's frontend)
        │
        ▼
   KPI views: bookings / human handoffs / follow-ups,
   filterable by last week, last month, last 2 months, etc
```

Every webhook event must be persisted with at minimum: `event_type`, `client_id` (or lead identifier), `timestamp`, `payload`. This is non-negotiable — the Build QA agent checks for it.

**Client fact sheet.** Every client has a `clients/<client-name>/facts.json` — the single source of truth for names, numbers, currency, percentages, dates, and codes. Every document and email must preserve each fact verbatim. Automated check: `scripts/verify_document.py`. A dropped number (`$10k/mo` → `/mo`) is an expensive failure — verification is non-negotiable and run by both the producer and the QA agent.

### 7.1 ConversionOS → Dashboard tracking (canonical)

Every client's lead handling runs through the SAME n8n workflow, **ConversionOS AI Text Agent**
(repo root: diagram `N8N_WORKFLOW.png`, export `n8n-conversionos.json`). Only the **industry**, the
**AI persona**, and the **tracked KPIs** change per client. The workflow:

1. **GHL fires the entry webhook** `…/webhook/e94670d8-d66d-499f-9460-f00e6cbd1fa1` with the form
   data and `body.customData['AI Type']` (`AI Intro Message Agent` | `AI Conversation Agent` |
   `AI Follow Up Agent`) plus `body['Message Aggregator']` (the message text).
2. **Set Contact ID** extracts `body.contact_id` (this IS the dashboard `client_id`).
3. **Switch** routes on `AI Type` into one of three lanes — Intro / Conversation / Follow Up.
4. Each lane replies **back INTO GHL** via its own HTTP Request node (outbound
   `services.leadconnectorhq.com/hooks/<locId>/webhook-trigger/…` URLs that make GHL send the
   WhatsApp/SMS message). ⚠️ These GHL webhook-trigger URLs are **n8n→GHL outbound** — they are
   NOT dashboard event sources.
5. The dashboard is fed by three extra HTTP Request nodes (already added in the n8n UI) that POST
   to `https://<deployment>/api/webhook/events`:

| n8n node (already added) | fires when | `event_type` |
|---|---|---|
| Dashboard - Conversation | intro message sent to a new lead | `conversation_started` |
| Dashboard - Handover | Classify (Human/AI) takes the Human branch | `handed_off_to_human` |
| Dashboard - Follow Up | Follow Up AI returns `followUpNeeded` | `follow_up_triggered` |
| (later) GHL booking trigger → n8n | contact books | `booking_made` |

Event envelope (non-negotiable): `{ event_type, client_id (= GHL contact_id), timestamp, payload }`.
KPI math: `conversation_started` counts a conversation; `booking_made` ÷ conversations = conversion
rate; `handed_off_to_human` = handover count (+ ÷ conversations = rate); `follow_up_triggered` =
follow-up count; follow-up **speed** = avg time from a lead's first conversation to first follow-up.
Node setup + troubleshooting (Using JSON, fx expression mode, the two 400/literal-text failure
signatures, 0% conversion until `booking_made`) lives in the playbook's
"n8n node wiring — EXACT config + troubleshooting" section.

### 7.2 Top 5 leads = real people only

The **Top Leads** table (bottom of the dashboard) must show REAL leads the AI agent actually
talked to — never sample, invented, or placeholder names. Driven by engagement (event count per
GHL `contact_id`) computed from **real webhook events only**:

- The **Dashboard - Conversation** node MUST send `payload.lead_name` (e.g.
  `{{ $('Webhook').item.json.body.first_name }}`) so the table shows a real first name; otherwise
  it falls back to the `client_id` verbatim (never synthesized).
- Seed sample events set `payload.meta.sample = true` → UI shows the **SAMPLE DATA** badge; dev
  preview only, never counted as real, never in a delivered dashboard.

### 7.3 Notion project store + LaunchOps portal

**Client/project operations data lives in Notion, not the dashboard.** The portal
(`launchops-portal/`) is the internal ops hub: it reads everything from six Notion
databases under the **LaunchOps HQ** page via a server-side token (`NOTION_TOKEN` in `.env`).
The store file `docs/notion-store.json` (copied to `launchops-portal/notion-store.json`)
maps database names → ids. Full model, API-version rules, and the per-client feedback
form workflow live in the **`notion-project-store` skill** (`.opencode/.agents/skills/notion-project-store`).
Load it before touching any portal/Notion project data.

**Client documents live in Notion, never in repo folders.** Every client-facing PDF
(proposal, contract, invoice, receipt) is stored in the **Client Documents** database
via `scripts/notion-upload-document.mjs` (Notion file-upload flow) and surfaced in the
portal **Documents** tab. No `clients/<name>/documents/` folders — generated PDFs go to
temp and are deleted after upload/email. "Amount paid" = invoice flipped to
`Status: Paid` + `Paid Date` + `Payment Method`.

Non-negotiable Notion rules (learned the hard way — see skill for details):

- **Never create databases with API version 2025-09-03** — it silently drops the schema
  and yields `Name`-only databases. Creation MUST use `2022-06-28`.
- Queries under 2025-09-03 must hit `/v1/data_sources/{id}/query`; under 2022-06-28,
  `/v1/databases/{id}/query`. The store file records `dataSources` so the portal handles both.
- Databases cannot be deleted via the API — broken/duplicate databases are deleted by
  Raymon manually in the Notion UI.
- Every new client gets a **native Notion feedback form** (page in the `Client Feedback`
  database) whose public form URL goes out in the kickoff/offboarding email; submissions
  land back in the store automatically.

---

## 8. Reporting Format

After **every** sub-agent + QA agent pair completes a task, the Leader Agent produces a short breakdown for Raymon in this format:

```
### [Sub-Agent Name] — [Task]
✅ / ❌ QA status
What was done:
- ...
What's next:
- ...
Flags for Raymon (if any):
- ...
```

This applies at every stage, not just at the end — Raymon gets a breakdown after Proposal, after Email, after Infrastructure, and after Build, each time QA clears it.

---

## 9. Global Rules (apply to every agent, no exceptions)

1. **No hallucination.** Never invent client details, numbers, dates, or scope. If information is missing, the agent must say so and ask the Leader Agent, not guess.
2. **QA is mandatory.** No sub-agent output moves to the next stage without a QA pass.
3. **Secrets stay in `.env`.** No API key, token, or credential is ever written into a prompt, template, or committed file.
4. **Skills folder is the source of truth for tooling.** Before an agent assumes it has a capability (PDF building, anti-hallucination prompting, etc.), it checks `.opencode/.agents/skills` for the relevant installed skill rather than improvising.
5. **Templates are canonical.** Proposal, contract, invoice, and receipt structure always come from the reference templates — agents don't freelance formatting.
6. **Every webhook event gets persisted.** No dashboard number is allowed to be computed live-only with no stored record behind it.
7. **Errors fail loud, not silent.** Any agent that hits an error state reports it in its breakdown rather than quietly falling back to placeholder data.
8. **Every output is verified against the fact sheet.** No document, email, or dashboard copy ships without passing the automated check (`scripts/verify_document.py`) for the client's facts in `facts.json`. A dropped number or a leftover placeholder fails the stage.
9. **Commit automatically after every completed task.** Once a task (and its QA pass, where applicable) is done and verified, the agent commits the changes to git with a concise message describing what was done. Never leave work uncommitted at the end of a session, and never include secrets or `.env` (gitignored). Only the current repo is committed — never push unless Raymon asks.

---

## 11. Feedback & Performance Loop

After every completed task — small or complex — the Leader runs the **Feedback Agent**, which:

- Asks Raymon what was done right (reinforce), what was wrong (correct), and any general notes.
- Records the feedback into `docs/performance/<agent>.md` — one log per sub-agent (proposal, email, infrastructure, builder) — using the standard entry format (`✅ Reinforce`, `❌ Correct`, `📌 Lesson`).
- Merges durable lessons into each log's **Standards** section.

Sub-agents read their own performance log **before every task** and follow the Standards. This is how the system improves without Raymon re-explaining corrections. The same correction twice → the Feedback Agent escalates to the Leader, who fixes the prompt or process rather than logging again.

---

## 12. Open Items to Confirm

- [x] Form/intake platform is GoHighLevel
- [x] Data store is Supabase
- [x] Deployment target is Vercel
- [x] PDF generation skill is `pdf` (`.opencode/.agents/skills/pdf`)
- [x] Notion project store + LaunchOps portal (`launchops-portal/`), backed by
      `docs/notion-store.json`; databases created with API `2022-06-28` (schema-safe)
- [ ] List of KPIs beyond bookings / human handoff / follow-up, if any — Pipeline confirmed
      **conversion rate** (bookings ÷ conversations) and **follow-up speed** (avg time to first
      follow-up); pattern is per-client, defined at discovery

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
