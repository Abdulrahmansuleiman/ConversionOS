# Build Spec — Solar London: Text Agent + Quote Workflow as One System

| | |
|---|---|
| **Client slug** | `solar-london` |
| **Spec version** | 1.0 |
| **Date** | 2026-09-26 |
| **Author** | Infrastructure Agent |
| **Status** | **For QA (Infrastructure) review → Leader → Builder** |
| **Supersedes** | nothing. Builds on `docs/n8n-quote-integration-audit.md` (audit not redone) |
| **Human gate** | §17 open questions are **blocking for Stage 1**. Do not build past Stage 0 without Raymon's answers. |

### Artifacts in scope

| Artifact | n8n ID | Live state | Source export |
|---|---|---|---|
| Text agent `Conversion0S \| Agent1` | `On1AWVSePFTjQfIt` | imported, `active=false`, **64 nodes live** | `c:\Users\lenovo\Downloads\Conversion0S _ Agent1 review.json` (43 nodes) |
| Quote workflow `LaunchOps Quoting Workflow` | `9lYm64rYASjJm11j` | imported, `active=false`, 19 nodes | `c:\Users\lenovo\Downloads\quote.json` (19 nodes) |

> ⚠️ **Live/export node-count mismatch (verified 2026-09-26 via read-only API).** The live text-agent
> workflow reports **64** nodes; the review export has **43**. The live workflow is authoritative. The
> Builder MUST work from a **fresh export of the live workflow**, not from the Downloads review JSON.
> Roadmap stage S2 makes this a hard gate.

### Only three credentials exist on the instance

`OpenAI account` (openAiApi, gpt-4.1) · `Postgres account` (postgres) · `Supabase account f1` (supabaseApi)

There is **no** Gmail, **no** Google Sheets, **no** HubSpot, **no** Stripe, **no** Ollama. This spec
builds a system that runs on exactly those three plus a new GHL outbound email webhook (§6).

---

## 1. Decisions applied (Raymon, final — not relitigated here)

| # | Decision | Consequence in this spec |
|---|---|---|
| 1 | Business = **SOLAR**. | Catalog is redefined as Solar London solar services. The four marketing services (Social Media Marketing / CRO / Website Build / SEO) are **removed and forbidden** — they are added to `must_not_contain` in the fact sheet as an anti-regression guard. |
| 2 | **HubSpot is OUT.** | 8 HubSpot nodes deleted. No GHL→HubSpot bridge. CRM = GoHighLevel only. |
| 3 | **Stripe is OUT.** | `Create Customer` / `Build Customer` deleted. No Stripe customer is created. |
| 4 | Delivery = **EMAIL to `body.email`**. | Quote emailed as PDF. See §6 — the email credential question is resolved there. |
| 5 | Model = **OpenAI** (existing `OpenAI account`, gpt-4.1). | `Ollama Chat Model` deleted. The LLM writes **prose only**; it never produces a number (§5, §13). |
| 6 | **Google Sheets catalog is OUT.** | `Find Services` deleted. Catalog is an in-workflow constant with a repo-side source-of-truth file and a SHA-256 anti-drift checksum (§4.1). |
| 7 | Trigger = **customer asks for pricing**. | `solar_london_quote` tool on `AI Conversation Agent`; prompt block in §9. Verified reachable: the pre-agent `Classify (Human/AI)` node has exactly one category (`Human`) with fallback `other`, and its classifier prompt explicitly says *"Do not match if the user is just asking a technical or informational question without requesting human interaction."* A price question therefore falls to the **AI branch** and reaches the agent. No classifier change is needed — **but see §9.1, this must be re-verified after any classifier edit.** |

---

## 2. Pricing blocker — the single most important constraint in this spec

Raymon's only price datum, verbatim from conversation:

> "it depends on what the person pick it a solar panel let say it about 6k pounds"

**That is the entire price input. It is ambiguous in at least four ways:** is 6k per *panel*, per
*install*, or a *lead budget*? Is it VAT-inclusive? Is it a real list price or an illustration? Is it
for home or commercial?

### 2.1 Hard rules (non-negotiable, applies to this spec, the Builder, and the generated prompts)

1. **NEVER invent, infer, round, extrapolate, or "reasonably assume"** any solar price, discount, VAT
   rate, turnaround, panel wattage, finance rate, or payment term. Not in the catalog, not in a
   default, not in an example, not in a sample payload, not in a test fixture, not in a comment.
2. **No numeric price literal appears anywhere in this spec or in any file it produces.** The only
   numbers permitted are structural (counts, field names, statuses) and the single verbatim quote above,
   recorded as *provenance*, not as a price.
3. Every price field in `catalog-template.json` is the literal string `"TBD"` until Raymon supplies a
   value in writing.
4. **Fail loud, never silent** (AGENTS.md §9.7): if any price needed for the requested services is still
   `"TBD"` at quote time, the workflow **aborts the quote** and returns a pre-written human-handoff
   line. It must never emit a partial quote, a zero, a range, a "from £X", or a model-invented number.
5. The `"TBD"` sentinel is **load-bearing**, not cosmetic: the pricing code parses every money field
   with a strict numeric regex. `"TBD"` fails that parse, and a failed parse is the abort trigger. The
   system therefore **cannot** produce a quote from an unresolved price even by accident.

### 2.2 What the ~6k statement may and may not be used for

It is recorded in `facts-template.json` under `pricing.source_quote_verbatim` as **provenance of an open
question**. It is **not** parsed into any catalog row, and it must not be used to sanity-check,
round, or bound a future Raymon-supplied price.

---

## 3. Target architecture

```
GHL form fill
     │  webhook e94670d8-d66d-499f-9460-f00e6cbd1fa1
     ▼
  Set Contact ID
     ▼
  Switch  (body.customData['AI Type'])
     ├─ Intro        → Chat Memory Manager1 → AI Intro Message Agent → Segment Response1 → HTTP Request  (GHL)
     ├─ Conversation → Chat Memory Manager  → Classify (Human/AI)
     │                                      ├─ Human → HTTP Request2 (GHL handoff)
     │                                      └─ AI    → AI Conversation Agent  ◄── ai_tool ──┐
     │                                                   │  calls when the lead asks for price │
     │                                                   ▼                                    │
     │                                        [NEW] solar_london_quote  (toolWorkflow) ───────┘
     │                                                   │
     │                                        ┌──────────▼──────────────────────────────────────┐
     │                                        │ "LaunchOps Quoting Workflow" (sub-workflow)   │
     │                                        │  Execute Workflow Trigger (CRM-agnostic)      │
     │                                        │  → Validate → Match → PRICE (deterministic)   │
     │                                        │  → IF Priced OK? ──no──► Return: Blocked TBD  │
     │                                        │        │ yes                                  │
     │                                        │  → Guard summary (LLM prose, number-filtered) │
     │                                        │  → Check Existing → Insert Intent (idempotent) │
     │                                        │  → IF New? ──no──► Return: Duplicate (no send)│
     │                                        │        │ yes                                  │
     │                                        │  → Build HTML → Render PDF → Store            │
     │                                        │  → Send Quote Email (GHL outbound webhook)    │
     │                                        │  → Mark Emailed → Return: Priced + Emailed    │
     │                                        └──────────┬──────────────────────────────────────┘
     │                                                   │ { ok, quote_rows_text, total, emailed, … }
     │                                        (tool result back to the agent)
     ▼
  Segment Response → HTTP Request1 → GHL  (UNCHANGED — every lead message, quoted or not)
```

**Hard architectural rule:** the sub-workflow has **no** path that sends a chat message. The only
outbound chat path in the entire system remains `AI Conversation Agent → Segment Response →
HTTP Request1 → GHL`. The quote returns **data** to the agent; the agent's normal reply path delivers
it. The quote never bypasses the GHL send path (AGENTS.md §7.1 direction correction).

---

## 4. Data requirements

### 4.1 Catalog — the single source of truth

| Role | Location | Written by |
|---|---|---|
| **Authoritative** (humans + agents) | `clients/solar-london/build-spec/catalog-template.json` → becomes `clients/solar-london/catalog.json` | Raymon / Infrastructure Agent |
| **Runtime copy** | literal `const CATALOG = {...}` inside the `Load Catalog` **Code** node | Builder (pasted verbatim from the repo file) |
| **Drift detector** | `catalog_checksum` field in both, SHA-256 of the canonical JSON | Builder, computed once at S1 |

**Why in-workflow and not a database:** Raymon's decision 6 said "deterministic in-workflow catalog",
the only credentials available are the three above, and a 3 KB constant in a Code node needs zero new
DDL. The cost is drift between the repo file and the node constant, so the **SHA-256 checksum is
mandatory** and S1 fails if the two do not match. A Postgres-backed catalog (v2) is described in
Appendix C if Raymon later wants to edit prices without opening n8n.

**Mandatory update procedure after S1** (also on the price-change path):

1. Edit `clients/solar-london/catalog.json` only.
2. Recompute the SHA-256 of its canonical form and write it into `catalog_checksum`.
3. Paste the new catalog into the `Load Catalog` Code node and update the same checksum there.
4. Re-run S1's verification. A mismatch is a hard stop.

#### Catalog row schema (field list — types are fixed by this spec)

| Field | Type | Rule |
|---|---|---|
| `key` | string, stable `snake_case` | The only thing the agent may pass. Never shown to the lead. |
| `display_name` | string | Customer-facing name, shown in the quote. |
| `category` | enum | `installation` \| `storage` \| `bundle` \| `maintenance` \| `removal` \| `finance` |
| `install_type` | enum | `home` \| `commercial` \| `both` — matched against the agent's `install_type` input. |
| `pricing_model` | enum | `flat` \| `per_unit` \| `per_watt` \| `TBD`. **Raymon chooses.** |
| `unit_label` | string | e.g. the per-install / per-panel / per-W wording. Must come from Raymon, not be inferred from `pricing_model`. |
| `unit_size` | string | Only meaningful for `per_watt` (panel wattage). Stays `"TBD"` until Raymon gives it. |
| `unit_price` | **string** | The price. String on purpose — see below. |
| `currency` | string | `GBP`. Fixed by decision 4. |
| `vat_included` | string | `yes` \| `no` \| `TBD` |
| `includes` | string[] | Bullet deliverables. `["TBD"]` until supplied. |
| `excludes` | string[] | Bullet exclusions. `["TBD"]` until supplied. |
| `turnaround` | string | `TBD` until supplied. Never inferred. |
| `lead_time_note` | string | Optional extra line. `TBD` if needed. |
| `active` | bool | `false` rows are never quoted. |
| `requires_quote_id` | bool | If `true`, the row may only appear on a **formal** quote (a numbered PDF), not in chat. |

**Why money is a string, not a number:** a numeric field cannot hold `"TBD"` without a type lie, and a
type lie is exactly how a default price sneaks in. Every money field is a string and the pricing Code
node enforces:

```
/^\d{1,9}(\.\d{1,2})?$/      → a real price, parsed to integer minor units (pence)
anything else, incl. "TBD"    → UNRESOLVED → abort the quote
```

No floats anywhere in the arithmetic: prices are parsed to **integer minor units (pence)**, summed as
integers, and only formatted for display. Two rows of the same service type are never double-counted.

### 4.2 Quote records — Postgres (new table, Raymon runs the DDL)

The agent cannot create tables (no DB password, and PostgREST/Postgres nodes cannot run DDL) — same
constraint as the dashboard playbook Phase 4. **Raymon runs this SQL in the same database that already
holds `Launchops_chat_memory`.**

```sql
create table if not exists solar_london_quotes (
  quote_id          text primary key,
  idempotency_key   text not null unique,
  contact_id        text not null,
  contact_name      text,
  email             text,
  company_name      text,
  install_type      text,
  services          jsonb  not null default '[]'::jsonb,
  currency          text   not null default 'GBP',
  subtotal_minor    bigint,
  total_minor       bigint,
  total_display     text,
  quote_rows_text   text,
  summary_text      text,
  status            text   not null,   -- emailed | blocked_tbd | failed_pdf | failed_email
  failure_reason    text,
  pdf_object_path   text,
  created_at        timestamptz not null default now(),
  emailed_at        timestamptz
);

create index if not exists solar_london_quotes_contact_idx
  on solar_london_quotes (contact_id, created_at desc);
```

Notes for the Builder:
- `Launchops_chat_memory` is **mixed-case**; it must stay quoted in SQL. Do not rename or touch it.
- Every read/write uses the `Postgres account` credential via the `n8n-nodes-base.postgres` node,
  `Resource: executeQuery`, with **Query Parameters** (never string interpolation of a lead's email
  into SQL — that is an injection path).
- `status` is always written before any outbound email (write-ahead), so a crash mid-send leaves a
  record rather than a silent gap (§9.7, §13).

### 4.3 Dashboard event envelope (optional, stage-gated — see §12)

```json
{
  "event_type": "quote_generated",
  "client_id": "<GHL contact_id>",
  "timestamp": "<ISO-8601 UTC>",
  "payload": {
    "lead_name": "<body.first_name>",
    "company": "<body.company_name>",
    "services": ["<catalog key>", "..."],
    "currency": "GBP",
    "total_display": "<exact string from the catalog>",
    "quote_id": "Q-20260926-XXXXXX",
    "emailed": true
  }
}
```

`event_type` = **`quote_generated`** (proposed). It is additive to the canonical set in AGENTS.md §7.1
(`conversation_started`, `booking_made`, `handed_off_to_human`, `follow_up_triggered`) and does not
replace any of them. `payload.meta.sample` is **never** set — this is real data only (§7.2).

---

## 5. The quote sub-workflow — exact node-by-node spec

**Goal:** the sub-workflow is CRM-agnostic, has exactly one `ai_tool` entry point, computes every
number in code, never lets an LLM produce a number, has **no `Merge` node**, and always terminates in
a result node so the Workflow Tool always receives an object.

### 5.1 Delete from `LaunchOps Quoting Workflow` (19 → 8 nodes)

| Delete | Why |
|---|---|
| `HubSpot Trigger` | CRM is GHL. Replaced by `When Executed by Another Workflow`. |
| `If` | Compared `dealstage` to `presentationscheduled`. HubSpot-only trigger condition. |
| `Get the deal`, `Get Company`, `Get Contact` | HubSpot. Replaced by flat tool inputs. |
| `Build Quote Payload` | HubSpot expressions. Replaced by `Validate Input`. |
| `Update Hubspot`, `Update deal` | HubSpot. |
| `Create Follow-up task` | HubSpot. **Also carries a hardcoded due date `2025-12-07T13:56:37`, already in the past** — the task is created overdue the moment it fires. |
| `Merge` (3-input) | **Root cause of defect B5.** Replaced by explicit branching (§5.3). |
| `Build Customer`, `Create Customer` | Stripe (decision 3). |
| `Find Services` | Google Sheets (decision 6). Replaced by `Load Catalog`. |
| `Ollama Chat Model` | No Ollama credential (decision 5). Replaced by the existing `OpenAI account` on `Quote Summary AI`. |

### 5.2 Node list (build order = execution order)

| # | Node name | Type | Purpose | Fails loud how |
|---|---|---|---|---|
| 1 | `When Executed by Another Workflow` | `n8n-nodes-base.executeWorkflowTrigger` | Flat input schema (§5.2.1) | — |
| 2 | `Validate Input` | `n8n-nodes-base.code` | Required fields, email shape, `currency == GBP` | returns `ok:false` → node 3b |
| 3a | `Load Catalog` | Code | Emits the `CATALOG` constant + `catalog_checksum` | checksum mismatch → `ok:false` |
| 3b | `Return: Bad Input` | `n8n-nodes-base.set` | Terminal: `ok:false` | — |
| 4 | `Match Services` | Code | Exact `key` match only; reports unmatched keys | zero matches → `ok:false` → node 5b |
| 5 | `Price Quote` | Code | **The guard.** Strict price parse; integer-minor arithmetic; builds `quote_rows_text` | any `TBD` → `ok:false, status:"blocked_tbd"` → node 6b |
| 5b | `Return: No Matching Service` | Set | Terminal: `ok:false` | — |
| 6 | `IF Priced OK?` | `n8n-nodes-base.if` | true → 7; false → 6b | — |
| 6b | `Return: Blocked — Price TBD` | Set | **Terminal.** `ok:false`, pre-written handoff line | — |
| 7 | `Quote Summary AI` | `@n8n/n8n-nodes-langchain.chainLlm` + `OpenAI Chat Model` (gpt-4.1, temp 0) | One customer-facing summary sentence. **Advisory only.** | — |
| 8 | `Guard Summary` | Code | Digit-allow-list filter on the AI sentence (§5.4) | any stray digit → summary discarded, deterministic line used |
| 9 | `Check Existing Quote` | `n8n-nodes-base.postgres` (executeQuery) | Idempotency lookup (§10) | DB error → **Continue (error output)** → `Return: Internal Error` |
| 10 | `Insert Quote Intent` | Postgres (executeQuery) | `INSERT … ON CONFLICT DO NOTHING RETURNING *` — write-ahead | 0 rows returned → already exists → node 11b |
| 11 | `IF New Quote?` | If | true → 12; false → 11b | — |
| 11b | `Return: Duplicate — Not Resent` | Set | **Terminal.** Stored quote returned, `duplicate:true`, **no email** | — |
| 12 | `Build Quote Document` | Code | Builds quote HTML **and** the plain-text version for chat. Placeholder scan. | any `[YOUR_*]` token survives → `ok:false` (defect B4 fix) |
| 13 | `Render PDF` | `n8n-nodes-htmlcsstopdf.htmlcsstopdf` | Community node — see §7 | **Continue (error output)** → node 15 |
| 14 | `Fetch PDF` | `n8n-nodes-base.httpRequest` (responseFormat `file`) | Binary property `data` | **Continue (error output)** → node 15 |
| 15 | `IF PDF OK?` | If | true → 16; false → `Mark Failed (PDF)` → 15b | — |
| 15b | `Return: Failed — PDF` | Set | **Terminal.** `ok:false, status:"failed_pdf"` | — |
| 16 | `Store PDF` | `n8n-nodes-base.supabase` (Resource: Storage, Operation: Upload) | `pdf_object_path` recorded in Postgres | Continue on error → logs a warning, email still sends |
| 17 | `Send Quote Email` | `n8n-nodes-base.httpRequest` → GHL outbound email webhook (§6) | Delivery | **Continue (error output)** → node 18 |
| 18 | `IF Email OK?` | If | true → 19; false → `Mark Failed (Email)` → 18b | — |
| 18b | `Return: Failed — Email` | Set | **Terminal.** `ok:false, status:"failed_email"` | — |
| 19 | `Mark Emailed` | Postgres (executeQuery) | `UPDATE … SET status='emailed', emailed_at=now()` | Continue on error → logs loudly (the email already went out) |
| 20 | `Return: Priced + Emailed` | Set | **Terminal + the workflow's final success output** | — |

**There is no `Merge` node anywhere in the new graph.** Every path is linear; a failure never leaves a
node waiting for an input that will not arrive. That is the direct fix for defect **B5**.

#### 5.2.1 `When Executed by Another Workflow` — input schema

Use the node's newest available typeVersion. If the node offers **JSON Schema** input mode, use it; if
your instance only offers the older **Input Data** field list, create the same seven fields there and
note the mode used in the build report. Do not guess the `type` enum — pick from what the node
actually offers and record it.

| Field | Type | Required | Description to use in the tool | Example |
|---|---|---|---|---|
| `contact_id` | string | **yes** | The GoHighLevel contact_id for this conversation. | `abc123XYZ` |
| `contact_name` | string | yes | The customer's name as it should appear on the quote. | `Jane Smith` |
| `email` | string | **yes** | The customer's email address. Must be the address already on the GHL contact. | `jane@example.com` |
| `company_name` | string | no | Their company. Leave empty for a home install. | `Acme Ltd` |
| `install_type` | string | **yes** | `home` or `commercial` | `home` |
| `requested_services` | string | **yes** | Comma-separated **catalog keys** — never free text. | `home_solar_install` |
| `quantity` | number | no | How many panels, if the customer said a number. | `8` |
| `conversation_notes` | string | no | One short factual line on what they asked for. Used for the document only. **Never parsed for a price.** | `Wants a price for 8 panels` |
| `currency` | string | **yes** | `GBP` | `GBP` |

`requested_services` is a **comma-separated string**, not an array, on purpose: it maps cleanly onto
both node input modes, avoids array-type ambiguity across n8n versions, and the `Match Services` Code
node does the splitting with a strict trim/lower-case. A comma-separated string is also easier for the
agent to fill correctly than a JSON array.

#### 5.2.2 `Price Quote` — the abort rule (pseudo-code, exact intent)

```
catalog        = CATALOG
keys           = requested_services.split(',').map(trim).filter(Boolean)
matched        = keys.map(k => catalog.services.find(s => s.key === k && s.active === true))
unmatched      = keys.filter((_, i) => !matched[i])

if (matched.length === 0)          -> ok:false, reason:'no_matching_catalog_service'
if (catalog_checksum !== EXPECTED)  -> ok:false, reason:'catalog_checksum_mismatch'

lines = []
for (row of matched) {
  if (row.install_type !== 'both' && row.install_type !== install_type)
        -> ok:false, reason:'service_install_type_mismatch:' + row.key

  price = parseMoneyStrict(row.unit_price)          // /^\d{1,9}(\.\d{1,2})?$/
  if (price === null) -> ok:false, status:'blocked_tbd',
                            reason:'catalog_price_tbd:' + row.key      // <-- THE ABORT

  qty  = (row.pricing_model === 'per_unit') ? (quantity ?? 1) : 1
  if (row.pricing_model === 'per_watt' && (quantity == null || parseMoneyStrict(row.unit_size) === null))
        -> ok:false, status:'blocked_tbd',
           reason:'catalog_price_tbd:' + row.key + ':unit_size'       // <-- also an abort

  minor = (row.pricing_model === 'flat')        ? price
        : (row.pricing_model === 'per_watt')    ? round(price * parseMoneyStrict(row.unit_size) * qty)
        : (row.pricing_model === 'per_unit')    ? price * qty
        : (row.pricing_model === 'TBD')         -> ok:false, status:'blocked_tbd',
                                                   reason:'pricing_model_tbd:' + row.key

  if (row.vat_included !== 'yes' && row.vat_included !== 'no' && row.vat_included !== 'TBD')
        -> ok:false, reason:'catalog_vat_invalid:' + row.key
  if (row.vat_included === 'TBD') -> ok:false, status:'blocked_tbd', reason:'catalog_vat_tbd:' + row.key

  lines.push(formatLine(row, minor, qty))       // plain text, no markdown, no HTML
}
total_minor = sum(lines.minor)                  // integers only
```

`formatLine` produces one plain-text line per row, e.g. `<display_name> - <qty wording> - <GBP figure>`.
It is built by the workflow, not by the LLM, so the customer-facing line is already correct before
the agent ever sees it. **If Raymon later says VAT is added on top, the VAT arithmetic goes in this
Code node only — never in the prompt and never in the model.**

### 5.3 The return object (exact contract)

Every terminal Set node emits a single JSON item with this shape. This is the **tool result** the
agent receives.

**Success (`Return: Priced + Emailed`)**

```json
{
  "ok": true,
  "status": "emailed",
  "quote_id": "Q-20260926-AB12CD",
  "duplicate": false,
  "quote_rows_text": "Home solar panel installation - 8 panels - GBP <figure from catalog>",
  "summary_text": "<one guarded sentence, or null>",
  "services": [{ "key": "home_solar_install", "display_name": "Home solar panel installation",
                 "line_total_display": "GBP <figure from catalog>" }],
  "total_display": "GBP <figure computed from the catalog>",
  "total_minor": 0,
  "currency": "GBP",
  "emailed": true,
  "email_delivery_method": "ghl_outbound_email_webhook",
  "lead_line": "<the same lines as quote_rows_text, prefixed naturally>",
  "failure_reason": null,
  "unmatched_services": []
}
```

**Every non-success case uses the same object with `ok:false`, `emailed:false`, and
`quote_rows_text:""` / `total_display:null`** — and one of these four pre-written `lead_line` literals,
stored in the workflow so they cannot be generated:

| Terminal | `status` | `failure_reason` | `lead_line` (verbatim literal, Amy's voice) |
|---|---|---|---|
| `Return: Bad Input` | `bad_input` | which field failed | `let me check that with my manager and come back to you` |
| `Return: No Matching Service` | `no_matching_service` | the unmatched keys | `let me check that with my manager and come back to you` |
| `Return: Blocked — Price TBD` | `blocked_tbd` | `catalog_price_tbd:<key>` | `let me check that with my manager and come back to you` |
| `Return: Failed — PDF` | `failed_pdf` | node name + n8n error message | `let me check that with my manager and come back to you` |
| `Return: Failed — Email` | `failed_email` | node name + n8n error message | `let me check that with my manager and come back to you` |
| `Return: Internal Error` | `internal_error` | node name + n8n error message | `let me check that with my manager and come back to you` |

The handoff phrasing is taken **verbatim from Amy's existing systemMessage** ("If the requested
information from the customer is not found you MUST tell the user something like: 'let me check that
with my manager'"). It is a literal in the workflow, not model output, so it matches her voice by
construction and cannot be hallucinated. One message for all failure modes is intentional: the lead
must not learn that a price database is incomplete.

### 5.4 `Guard Summary` — the "LLM never owns a number" enforcement

Decision 5 keeps OpenAI, but only for **prose**. The chain:

1. `Quote Summary AI` — one sentence, e.g. "I've put together a quote based on what you've told me."
2. `Guard Summary` Code node:
   - Collect the set of digit-groups appearing in the **priced** fields (`quote_rows_text`, `total_display`, every `line_total_display`).
   - Strip every digit-group from the AI sentence that is **not** in that set.
   - If anything was stripped, or the sentence still contains a currency symbol, `%`, or the substring `TBD` → **discard the AI sentence entirely** and set `summary_text: null`. The deterministic `lead_line` is used instead.
   - A discarded summary is **not** an error. It is expected occasionally and is harmless.

This makes the rule mechanical rather than aspirational: no number the agent can read has any path to
existence that does not pass through `Price Quote`.

---

## 6. Email delivery — the credential question, resolved

**DECISION: option (b), a GHL outbound email webhook. This is the default and the spec is not
ambiguous about it.**

Reasoning, briefly: the instance has no Gmail credential, and a GHL outbound email webhook needs **no
new credential at all** — it is the same mechanism already proven in this workflow three times
(`HTTP Request1/2/3` → `services.leadconnectorhq.com/hooks/…`). It also keeps **GHL as the single
sender**, which means the quote email comes from Solar London's own GHL sending domain, lands in the
same thread as the WhatsApp conversation, and appears in GHL's conversation record next to the
messages Amy sent. Adding a Gmail credential would create a second sending identity for the same
business, and GHL would have no record that the email was sent.

Option (a) (add a Gmail credential, keep the stock `Email the Quote` node) is documented as the
**escape hatch**, to be used only if Raymon decides he wants a native PDF attachment immediately and
is willing to add the credential and accept the second sender.

### 6.1 `Send Quote Email` — exact node config

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.httpRequest` |
| Method | `POST` |
| URL | `https://services.leadconnectorhq.com/hooks/<GHL_LOCATION_ID>/webhook-trigger/<WEBHOOK_TRIGGER_UUID>` |
| Authentication | **None** (GHL trigger URLs are unguessable UUIDs; this matches the three existing nodes) |
| Send Body | **ON** |
| Specify Body | **Using Parameters** ← matches the three working nodes. **Do NOT use "Using JSON" here.** The dashboard webhook in the playbook requires JSON; GHL accepts form-encoded. Using the wrong one is a real, already-documented failure mode. |
| Timeout | 30000 ms |

**⚠️ The URL is a blocking open item.** Raymon must build the GHL workflow and paste its webhook-trigger
URL here. The existing three use location id `Led6m5lQlg4mLFp0cFdg`; a **new** trigger gets a **new
UUID**, so it must be copied fresh from the GHL automation — do not guess or reuse one of the three
WhatsApp/SMS URLs.

Body parameters:

| Name | Value |
|---|---|
| `Contact ID` | `={{ $('When Executed by Another Workflow').item.json.contact_id }}` |
| `Email Subject` | `=Your quote from Solar London` |
| `Email Body HTML` | `={{ $('Build Quote Document').item.json.quote_email_body_html }}` |
| `Quote PDF Path` | `={{ $('Store PDF').item.json.pdf_object_path }}` (only when PDF storage is live — §6.3) |

### 6.2 Why this is also the anti-hallucination win for the email address

The send is keyed on **`Contact ID`**, not on an email string typed by a model. GHL resolves the
recipient from its own contact record. The `email` tool input is therefore only used to **display** the
address in the quote document, and the workflow validates its shape
(`/^[^@\s]+@[^@\s]+\.[^@\s]+$/`) before accepting it. If the address is empty or malformed the workflow
still proceeds on `Contact ID` alone; if `Contact ID` is missing it aborts. **There is no path by
which a hallucinated address becomes the delivery target.**

### 6.3 The PDF attachment — the part Raymon must choose

GHL webhook triggers do not take a base64 file body, so the PDF has to be reachable by URL. Two
workable routes:

| Route | What it needs | Verdict |
|---|---|---|
| **B1 — HTML body email, no attachment** (v1) | nothing beyond the GHL webhook from §6.1 | **Ship this in v1.** The customer gets the full quote formatted in the email body, the price is in the chat, and the system is fully functional with zero new infrastructure. |
| **B2 — PDF attachment via Supabase Storage** (v1.1) | Raymon creates a Storage bucket + a **time-limited signed-URL policy**; `Store PDF` uploads via the existing `Supabase account f1` credential; the signed URL is passed to GHL | Build **only after** Raymon confirms the `Supabase account f1` credential carries a **service-role** key (anon keys cannot upload). Use a **signed, expiring URL — never a public bucket** (a public bucket would put every client's quote PDF on the open internet). |
| **A — Gmail credential** (escape hatch) | Raymon adds a Gmail OAuth2 credential to the instance | Only if Raymon prefers a native attachment now. Keeps the stock `Email the Quote` node, whose `attachmentsBinary: [{ property: "data" }]` wiring is already correct. |

**Recommendation: ship B1 in v1, add B2 in v1.1 once the bucket exists.** The PDF is still generated and
archived in v1 (so the artifact exists and the document is auditable) — it is simply delivered as
formatted HTML rather than as a file. The chat always carries the exact figure, so the customer is
never left without the number.

---

## 7. `HTML to PDF` — community node, verify first

`HTML to PDF` is node type `n8n-nodes-htmlcsstopdf.htmlcsstopdf` — a **community package, not a stock
n8n node**. It is not guaranteed to be installed. Its two downstream neighbours assume its exact
output shape (`Fetch PDF` reads `$json.pdf_url`; `Email the Quote` reads binary property `data`), so
if it is missing the whole tail of the old workflow was dead code.

### 7.1 Verify (Builder, stage S3 — pick a method and record the result in the build report)

1. **Node panel:** in n8n's node search, type `html` and look for an "HTML to PDF" / "HTMLCSStoPDF"
   entry. Present → installed. Absent → not installed.
2. **Existing workflow:** open `LaunchOps Quoting Workflow` and click `HTML to PDF`. A red
   *"unrecognized node type"* banner → not installed. The node rendering normally → installed.
3. **Container (if self-hosted via Docker), read-only:**
   `docker exec <n8n-container> npm ls n8n-nodes-htmlcsstopdf` and/or
   `docker exec <n8n-container> sh -lc "ls node_modules | grep htmlcsstopdf"`.
4. **Server log:** a missing community package logs an `unrecognized nodes` / "Node type … not found"
   line during n8n startup.

### 7.2 If it is NOT installed

**Fallback, in order:**

1. **PRIMARY FALLBACK — email the HTML (route B1, §6.3).** Skip `Render PDF` / `Fetch PDF` / `Store PDF`
   entirely and send the styled quote as the email body. The PDF is dropped from the v1 path; the
   quote still reaches the customer in full. **This is the recommended outcome — it is not a
   compromise, and it removes a fragile community dependency from a production path.**
2. **Render the PDF outside n8n.** The `pdf` skill at `.opencode/.agents/skills/pdf` is a **repo-side**
   tool. The n8n instance has no access to this repo and no Python/pypdf in its container, so the
   skill **cannot** be invoked from inside a workflow. If Raymon wants automated PDFs, the supported
   route is a small sidecar service (a tiny HTTP service that renders PDF) or route **B2** with a real
   renderer. **Do not spec "call the pdf skill from n8n" — it is not executable.** If Raymon prefers
   the skill, the PDF becomes a manual step: the Infrastructure/Proposal Agent renders it on the repo
   side and the emailed HTML is the automatic path.

**Decision rule for the Builder: do not install new community packages into Raymon's production n8n
without Raymon's explicit go-ahead.** If the node is missing, report it, ship B1, and ask.

---

## 8. Wiring the tool into the text agent

### 8.1 The new node

| Field | Value |
|---|---|
| Node name | `solar_london_quote` |
| Node type | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| Workflow from | **"LaunchOps Quoting Workflow"** (the rebuilt sub-workflow) |
| Connect `ai_tool` output → | **`AI Conversation Agent`** (alongside the existing `Supabase Vector Store`) |

### 8.2 Tool name + description (paste verbatim — this is what drives trigger reliability)

**Name:** `solar_london_quote`

**Description:**
> Get an official price quote for Solar London services. Use this ONLY when the customer asks for a
> price, a cost, an estimate, a quote, a price list, a package, or how much something costs. This tool
> sends the written quote to the customer's email address and returns the exact prices and the total.
> Call it once per request. You must never state a price that is not in this tool's result.

### 8.3 Tool input schema — what the agent must fill

| Tool input | Type | Instruction text to use in the node |
|---|---|---|
| `contact_id` | string | The GoHighLevel contact id for this conversation. Use the expression `={{ $('Set Contact ID').item.json['Contact ID'] }}` as the field default. |
| `contact_name` | string | The customer's full name exactly as it should appear on the quote. |
| `email` | string | The customer's email address, exactly as it appears on their GHL contact record. |
| `company_name` | string | Their company name. Leave blank for a home install. |
| `install_type` | string | Either `home` or `commercial`, based on what the customer told you. |
| `requested_services` | string | Comma-separated service keys from the service list. Never free text, never a sentence. |
| `quantity` | number | How many panels the customer said, if they said a number. Otherwise blank. |
| `conversation_notes` | string | One short factual line: what they want priced. |
| `currency` | string | Always `GBP`. |

**Identity fields must be expressions, not model output.** `contact_id`, `contact_name`, `email` and
`company_name` are set as **field defaults referencing `$('Set Contact ID')` and `$('Webhook')`**, so
they come from real GHL data and not from the model's transcription of a chat transcript.

> **⚠️ Contingency the Builder MUST test at S6, not assume.** n8n does not evaluate expressions in every
> context, and Workflow Tool input defaults are one such context. **Test it.** Execute one real
> conversation and read the row that lands in `solar_london_quotes`: `contact_id` and `email` must be
> the **real GHL values**, never the literal string `{{ ... }}` and never a value the agent typed.
> If the expressions do not resolve, the fallback is to have the sub-workflow read the parent's `Webhook`
> node directly inside a Code node — and that too must be **tested end to end**, not assumed.
> If neither mechanism resolves, **stop and report back to the Leader.** Do not ship a build where an
> LLM is transcribing an email address from a chat transcript; that is precisely the hallucination this
> whole spec exists to prevent. (Mitigating fact: delivery is keyed on `Contact ID`, so a wrong `email`
> string cannot misroute the message — but the `contact_id` itself must be real.)

### 8.4 The pre-agent classifier must not steal price questions

`Classify (Human/AI)` sits **before** `AI Conversation Agent` and has one category, `Human`, fallback
`other`. Today a price request routes to the AI branch, which is what we want. If anyone ever adds a
category to that classifier (e.g. "Pricing" → Human), the lead will be handed off before it can ever
reach the quote tool. **S6's acceptance test includes a price question reaching the agent, not being
handed off.**

---

## 9. The exact `systemMessage` block to append

**Append to the existing `AI Conversation Agent` systemMessage. Do not rewrite, reorder, or remove any
existing line** — the persona, the qualification questions, the booking-link rules, and the human-voice
rules are working and are not this project's business. The existing block is roughly 60 lines; this
adds 24 more and changes nothing that is already there.

Paste this at the **end** of `AI Conversation Agent → Options → System Message`:

```
# Quotes and Pricing

- If the customer asks how much something costs, or asks for an estimate, a quote, a price, a price
list, a package, or a price for a specific number of panels, you MUST call the solar_london_quote tool
once and then use its result. You must never answer a pricing question from memory.

- Only ONE tool call per turn. If you already called it this turn, use the result you already have.

- Fill the tool inputs from what the customer actually told you. The service keys must be the keys
from the service list, never a sentence or a description. If you are not sure which key applies, call
the tool with the closest one and let it tell you, rather than guessing at a number yourself.

- GROUNDING RULE. You may only state a number that appears in the tool result. Every price, total and
figure you tell the customer must be copied exactly from the tool result. If the number is not in the
tool result, you do not know it, and you do not say it.

- DO NOT INVENT DATA. Never guess, estimate, round, infer, or recall a price, discount, VAT rate,
install time, panel size, or payment plan. Not from an earlier conversation, not for another customer,
not from anything you think you remember about solar panels. Ever. A made up price is far worse than no
price.

- If the tool result has ok false, do NOT mention any price at all, and do not say why it failed. Just
tell the customer in your own normal voice that you are checking it with your manager and you will come
straight back to them, then keep the conversation warm and continue. Do not apologise more than once and
do not mention tools, systems, catalogs, automations, or a quote system.

- If the tool result has ok true, relay the quote rows from the tool result as they are written, then
mention you have sent the full quote over email and offer the booking link. Do not restate a figure in
a different way, do not convert it, do not round it, and do not offer a discount, payment plan, or
installation date that is not in the tool result.

- The tool sends the written quote to the customer by email. Do not ask for their email address, do not
ask them to confirm one, and do not promise to resend the quote inside the chat.

# Output rules for quotes. These override anything above.

- Plain text only. No markdown, no bullet characters, no bold, no tables, no HTML, no headings.
- Put each price in its own message so it is not split or merged with other text.
- If you have already given the prices in this conversation, do not repeat the whole quote unless the
customer asks for it again.
```

**Why this shape** (prompt-engineer conventions): role and task unchanged; a trigger condition stated
as a concrete list of phrases; an explicit grounding rule; an explicit don't-invent clause with the
*reason* ("a made up price is far worse than no price"), which raises compliance; a branch for every
tool outcome so the model never has to improvise; and a format section at the end because format rules
recency-weighted by the model hold better than format rules buried in the middle. The one deliberate
departure from her existing prompt is the new `GROUNDING RULE` heading — it is written as a hard rule
to match the weight of the existing `VERY IMPORTANT` rules rather than as a soft suggestion.

**Do not add a long em dash anywhere in this block** — her existing rules forbid them in output and a
`—` in a prompt is a needless formatting hazard. Plain ASCII only.

---

## 10. Idempotency and no double-send

Two separate hazards, both real: the tool gets called twice in one turn (the agent re-deciding), and
the lead re-asks later in the day (a human pressing "what about price?").

### 10.1 The key

```
idempotency_key = [ contact_id,
                    matched keys sorted and joined by '+',
                    new Date().toISOString().slice(0,10),   // UTC day
                    attempt ].join('|')
```

- Same turn, same services, same day → **same key** → one email.
- Next day, same services → **different key** → a legitimately fresh quote is allowed.
- Changed service set → different key.

### 10.2 The two-node guard (write-ahead)

1. `Check Existing Quote` — `SELECT status, quote_id, quote_rows_text, total_display FROM
   solar_london_quotes WHERE idempotency_key = $1`. Reads only.
2. `Insert Quote Intent` — `INSERT … VALUES (…) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`.

Decision table:

| Stored row found? | Stored `status` | Action |
|---|---|---|
| no | — | `attempt = 0`, insert, proceed to email |
| yes | `emailed` | `Return: Duplicate — Not Resent`. Return the **stored** quote rows and `quote_id`, `duplicate:true`, `emailed:true`. **No PDF, no email.** |
| yes | `blocked_tbd` | bump `attempt` (so a real re-ask after Raymon fills the catalog works) and re-run. Cap `attempt < 3`, then `Return: Internal Error` with reason `max_attempts_reached`. |
| yes | `failed_pdf` / `failed_email` | bump `attempt` and retry once per turn, cap 3. |
| yes (insert returned 0 rows) | any | Same table as above — a concurrent call won the race. Treat as duplicate; **never send.** |

**`Insert Quote Intent` must execute before any outbound email.** If the two were reordered, two
concurrent calls could both pass the check and both send. This ordering is a correctness requirement,
not a style preference.

**The duplicate branch must return the stored row's numbers**, not re-run the pricing. That is what
makes a re-ask read as a helpful repeat rather than a second, possibly different, quote.

### 10.3 What the lead experiences

- Called once → price in chat + one email.
- Called twice by accident → one email, one price in chat, `duplicate:true` internally.
- Re-asked an hour later → the **same** numbers again, no second email.
- Re-asked tomorrow → a fresh quote id, one email, same or updated prices.

---

## 11. The GHL send path is reused, unchanged

The reply chain stays exactly as it is:

```
AI Conversation Agent  →  Segment Response  →  HTTP Request1  →  services.leadconnectorhq.com/hooks/…
```

- `HTTP Request1` URL, body parameters (`Contact ID`, `Message1..Message5`, `Conversation History`)
  and the `Segment Response` split rules are **not modified** by this project.
- The quote sub-workflow sends **no** chat message. It returns `quote_rows_text` and the agent's own
  reply carries it.
- `Conversation History` continues to be populated from `$('Chat Memory Manager')`, so the quote turn
  is in the history GHL receives.

### 11.1 Known residual risk, stated honestly

`Segment Response` is an LLM that rewrites and splits the agent's message. A price could in principle
be reformatted (for example into a currency symbol or a slightly different grouping). Mitigations in
place: the prompt block requires each price to be its own message; `Guard Summary` has already removed
every unverified digit before the agent sees it. **Residual risk is not zero** and is not eliminable
while the splitter is an LLM.

- **S6/S9 acceptance test:** read the actual delivered WhatsApp message and confirm it contains the
  **exact figure** from the catalog. This is a required QA step, not an optional one.
- **v2 option if QA ever catches a corrupted figure:** emit the price lines through a deterministic
  passthrough (a Code node that appends the price block to the segmented messages after `Segment
  Response`, unmodifiable by the model) rather than through the LLM splitter. Not built in v1; noted
  so it is not a surprise later.

---

## 12. Dashboard event — optional, stage-gated

**Recommended: yes, but NOT in the first build.** Solar London has no confirmed dashboard deployment,
and AGENTS.md §6 requires a real URL.

- **Add the node** `Dashboard - Quote`, type `n8n-nodes-base.httpRequest`, placed after `Mark Emailed`,
  **only once Raymon supplies a live dashboard deployment URL.**
- Method `POST`, URL `https://<deployment>/api/webhook/events`, Send Body ON, **Specify Body: Using
  JSON** (the playbook is explicit: *Using Parameters* is the cause of the
  `400 event_type is required` failure), click `fx` on the body field so the expressions resolve.
- Body: the envelope from §4.3, with `client_id` = `$('Set Contact ID').item.json['Contact ID']` and
  `payload.lead_name` = `$('Webhook').item.json.body.first_name`.
- **Never** set `payload.meta.sample` — real leads only (§7.2).

Three things this node does **not** do, so the Builder does not scope-creep:

1. It does not add a `quote_generated` KPI card. The standard dashboard renders the four canonical
   KPIs; a fifth is a separate, separately-approved piece of work.
2. It does not change the conversion rate. Conversion is still `booking_made ÷ conversations`.
3. It is not required for the quote feature to work. **If no dashboard exists, the node is simply not
   created** and the roadmap stage is marked skipped with the reason, not silently omitted.

---

## 13. Error handling — fail loud, never silent (AGENTS.md §9.7)

### 13.1 What the old flow did wrong, and the fix

| Old behaviour | Why it was dangerous | Fix |
|---|---|---|
| 3-input `Merge` waiting on all three branches | A Stripe/Gmail/PDF/Ollama failure left the merge **never firing**, so the follow-up task was silently never created | **No `Merge` node at all.** Every path is linear and ends in a `Return:` node. |
| No path for the quote to reach the chat (workflow output was a HubSpot engagement) | The conversation could never show a price | The final node is `Return: Priced + Emailed`, which **is** the tool result. |
| A failing branch produced no error anywhere in the UI | A silent stall reads as "nothing happened" | Every fallible node is set to **Continue (using error output)** and every failure feeds a `Return:` node with a populated `failure_reason`. |
| A literal `2025-12-07` due date | Follow-up tasks created overdue on arrival | Node deleted (HubSpot out). |
| `[YOUR_AGENCY_NAME]` etc. shipped in output | Placeholders reached customers | `Build Quote Document` scans the rendered HTML for `\[YOUR_[A-Z_]+\]` and **aborts** if anything matches. |

### 13.2 Backstop: the n8n Error Workflow

Set an **Error Workflow** on the n8n instance (Settings → Error Trigger) with a `Gmail`/`HTTP Request`
notification to Raymon. This catches the failures the sub-workflow deliberately swallows — a Postgres
outage at the wrong moment, a `Code` node syntax error, an n8n server restart mid-quote. The
sub-workflow's own `failure_reason` values keep the *customer-facing* path calm; the Error Workflow
keeps *Raymon* informed. Both are required: a system that is calm to the customer and silent to the
operator is exactly the defect this section exists to remove.

### 13.3 Never do these

- Never fall back to placeholder or sample data on an error path.
- Never let a failure be swallowed with no `failure_reason` recorded in Postgres.
- Never return `ok:true` with `emailed:false`.
- Never return a number that did not come from `Price Quote`.

---

## 14. Builder prompt — grounding and anti-hallucination rules

**Copy this block into the Builder Agent's task prompt verbatim.** Written per the `prompt-engineer`
skill (`.opencode/.agents/skills/prompt-engineer`) and required by AGENTS.md §5.

```
## Grounding rules for this build

You are implementing the Solar London quote integration from
clients/solar-london/build-spec/quote-integration-spec.md. The spec is the contract. If a detail is
not in the spec, you do not decide it yourself.

1. DO NOT INVENT DATA. The only price information in existence is the literal string "TBD" in
   clients/solar-london/build-spec/catalog-template.json. You must never write a real or example
   price, discount, VAT rate, install time, panel wattage, or payment term anywhere - not in the
   catalog, not in a Code node default, not in a test fixture, not in a sample webhook payload, not in
   a comment, not in the build report. If a test needs a price, the only legitimate test value is the
   literal string "TBD" and it must be testing the abort path.
2. The single price statement Raymon has made in conversation is: "it depends on what the person pick
   it a solar panel let say it about 6k pounds". It is ambiguous, it is recorded as provenance of an
   open question, and you must never parse it into a price, use it as a default, or use it to check a
   future value.
3. Every money field in the catalog is a STRING. Prices are parsed with /^\d{1,9}(\.\d{1,2})?$/ and
   computed in integer minor units. Anything that fails that parse is UNRESOLVED and must abort the
   quote. Do not introduce floats for money, and do not introduce a fallback price.
4. Every number the agent can possibly see must originate in the Price Quote Code node. The LLM writes
   prose only, and Guard Summary strips any digit from that prose which is not in the priced fields.
   Do not weaken Guard Summary, and do not add a second place where a total is computed.
5. Do not create a Merge node. Do not create a node with a credential that does not exist on the
   instance (the only three are OpenAI account, Postgres account, Supabase account f1).
6. Do not write a credential, API key, token, or password into any file, node parameter, prompt, or
   report. Reference credentials by name only. Secrets live in .env and nowhere else.
7. If a fact, a price, a URL, or a decision is missing, STOP and report it in the build report as an
   open item. A blocked stage reported honestly is a success. An invented value shipped into a client
   dashboard or a customer email is a critical failure.
8. Fail loud. Every fallible node continues to an explicit error branch, and every failure records a
   failure_reason. Never silently substitute data, never return a zero, never return a partial result.
9. If a spec item is ambiguous, implement the literal reading and list the ambiguity in the build
   report. Do not silently pick the interpretation you find most likely.
```

---

## 15. Roadmap

Each stage names its dependency and **what proves it is done**. No stage depends on a later stage.

| Stage | Work | Depends on | Done when |
|---|---|---|---|
| **S0** | Raymon answers §17 and runs the `solar_london_quotes` DDL from §4.2 | — | Answers in writing, in the repo; SQL executed; `solar_london_quotes` exists and Raymon confirms it |
| **S1** | Fill `catalog.json` + `facts.json` from Raymon's answers; compute `catalog_checksum`; render one sample quote PDF; verify | S0 | Zero `"TBD"` in the catalog; `python scripts/verify_document.py clients/solar-london/facts.json <sample>.pdf` prints `ALL PASS`; checksum recorded in both places |
| **S2** | Export **both live workflows** (dated) to `clients/solar-london/build-spec/`; write the node keep/delete inventory (Appendix A) | — | Two dated JSON exports on disk, taken from the live instance, not from `Downloads/` |
| **S3** | Node-availability audit: `executeWorkflowTrigger`, `toolWorkflow`, `n8n-nodes-base.supabase`, community `htmlcsstopdf` (§7.1); record the PDF decision | S2 | Each node's availability recorded in the build report; the PDF route (B1 or B2) chosen |
| **S4** | Rebuild the quote workflow: nodes 1–8 + 6b + terminals, deterministic pricing, abort guard, no Merge, no LLM numbers | S1, S2, S3 | Manual run with a **filled** catalog returns exact totals; manual run with a `"TBD"` catalog returns `ok:false, status:"blocked_tbd"` and the handoff line; a grep of the workflow shows **no** `Merge`, no `hubspot`, no `stripe`, no `googleSheets`, no `ollama` |
| **S5** | `Guard Summary` + guard nodes 9–20; email path per §6; idempotency per §10; Error Workflow set | S4 | Test email arrives at Raymon's own inbox with the exact catalog figure; a second identical call sends **no** second email; every failure path returns a `failure_reason` |
| **S6** | Attach `solar_london_quote` to `AI Conversation Agent`; append the §9 systemMessage block | S5 | A real GHL form fill where the lead asks a price: agent calls the tool **once**, the WhatsApp message contains the **exact** catalog figure, **one** email is sent, and the lead is **not** handed off by `Classify (Human/AI)` |
| **S7** | Idempotency test matrix: twice in one turn; re-ask same day; re-ask next day; unknown service key; `"TBD"` catalog; no `body.email`; malformed email | S6 | Exactly one email per intended quote; `duplicate:true` on repeats; identical numbers on re-asks; no number ever reaches the lead in the abort cases |
| **S8** | *(Optional, only if Raymon supplies a live dashboard URL)* add `Dashboard - Quote` | S7 + dashboard URL | Green `201`; the event visible in Supabase with the real `client_id`; **or** stage marked skipped with the reason recorded |
| **S9** | Activate; post-deploy verification; final exports as the rollback point; build report | S7 (S8 if in scope) | Workflows `active=true`; 10 real-lead test conversations logged with no silent stalls; final exports saved and linked from the report |

**Ordering is strictly S0 → S1 → S2/S3 → S4 → S5 → S6 → S7 → S8 → S9.** S2 and S3 may run in
parallel with S1. **S0 and S1 gate everything**: a quote system with `"TBD"` prices cannot be tested
end to end, and building S4–S7 before S1 means testing against a catalog that is guaranteed to abort.

---

## 16. Appendix A — node inventory (audit trail for the Builder)

### `LaunchOps Quoting Workflow` — keep / rewrite / delete

| Node | Action |
|---|---|
| `HubSpot Trigger` | **DELETE** |
| `If` | **DELETE** |
| `Get the deal` | **DELETE** |
| `Get Company` | **DELETE** |
| `Get Contact` | **DELETE** |
| `Build Quote Payload` | **DELETE** (replaced by `Validate Input`) |
| `Update Hubspot` | **DELETE** |
| `Update deal` | **DELETE** |
| `Create Follow-up task` | **DELETE** (also drops the hardcoded past due date) |
| `Merge` | **DELETE** (defect B5) |
| `Build Customer` | **DELETE** (Stripe) |
| `Create Customer` | **DELETE** (Stripe) |
| `Find Services` | **DELETE** (Sheets) |
| `Ollama Chat Model` | **DELETE** (no credential) |
| `AI Agent` | **REWRITE** → `Quote Summary AI` (`chainLlm`, gpt-4.1, prose only) |
| `HTML Payload` | **REWRITE** → `Build Quote Document` (Solar London, facts-sourced, placeholder-scanned) |
| `HTML to PDF` | **REWRITE** → `Render PDF` (availability per §7) |
| `HTTP Request` | **REWRITE** → `Fetch PDF` (unchanged shape: `responseFormat: file`, binary property `data`) |
| `Email the Quote` | **REWRITE** → `Send Quote Email` (GHL outbound webhook, not Gmail) |
| *(new)* | 18 nodes from §5.2 |

### `Conversion0S | Agent1` — the only change

| Node | Action |
|---|---|
| `AI Conversation Agent` | **APPEND** the §9 block to `Options → System Message`. Nothing else changes. |
| *(new)* `solar_london_quote` | **ADD** `@n8n/n8n-nodes-langchain.toolWorkflow`, `ai_tool` → `AI Conversation Agent` |
| `Webhook`, `Set Contact ID`, `Switch`, `Classify (Human/AI)`, `Chat Memory Manager*`, `AI Intro Message Agent`, `AI Intro…`, `Segment Response`, `Segment Response1`, `HTTP Request1/2/3`, `HTTP Request`, `Postgres Chat Memory`, `Supabase Vector Store*`, `Embeddings OpenAI*`, Google Drive / loader / splitter / clear-table nodes | **NO CHANGE** |

---

## 17. Open questions to Raymon — BLOCKING

### 17.1 The price questions (nothing ships until these are answered)

Raymon gave one ambiguous sentence: *"it depends on what the person pick it a solar panel let say it
about 6k pounds."* To turn it into a real catalog I need:

1. **Is the ~6k per panel, per install, or per project?** This is the single question that matters most.
2. Is that figure **VAT-inclusive** or **plus VAT**? If plus VAT, what is the VAT rate?
3. Is it a **real list price** or an illustration for a conversation? If real, does it have a minimum?
4. Does the price **vary** with panel count? If so, is there a base price plus a per-panel price, and
   are both needed?
5. What is the **panel wattage** you install (needed only if pricing is per watt)?
6. What is the **install turnaround**, in days or weeks, for a home install and for a commercial one?
7. Is a quote a **fixed price** or an **estimate** subject to a site survey? This changes the wording on
   the document, not just a line of the catalog.
8. How long is a quote **valid** (e.g. 30 days)? This must be printed on the document.
9. Are there **payment terms / finance** options you want quoted as a line item, and if so, from which
   provider?
10. Are **surveys, scaffolding, or crane hire** charged separately, included, or excluded?

### 17.2 The catalog itself

11. **Is this the right set of services?** These are *proposed keys only* — rename, add, or delete freely:
    `home_solar_install` (home solar panel installation) · `home_battery_storage` (home battery
    storage) · `home_solar_with_battery` (home solar + battery bundle) · `commercial_solar_install`
    (commercial solar installation) · `solar_maintenance` (maintenance & monitoring) ·
    `solar_repair` (fault rectification) · `electric_ev_charger` (EV charger installation) ·
    `solar_removal` (removal / decommissioning) · `finance_options` (finance as a quoted line).
12. For each one you keep: what is `pricing_model` — `flat`, `per_unit` (per panel), or `per_watt`?
13. Which services apply to **home** only, **commercial** only, or **both**?
14. What goes in `includes` and `excludes` for each?

### 17.3 The business facts (all of these are currently literal `[YOUR_*]` placeholders in the old document)

15. The **exact registered/ trading company name** for the document header, footer, and email signature.
16. The **sender email address** and the **phone number** to print.
17. The **postal address / company location** to print (the persona mentions Canary Wharf, London).
18. Should the document carry any **Trustpilot or review line**? The persona cites "500+ 5 star" — confirm
    that is current before it goes on a client-facing quote.
19. **VAT registration number**, if one should appear on the document.
20. Any **terms line** you want on the document (e.g. "prices subject to a site survey").

### 17.4 The build-blocking technical questions

21. **GHL email webhook trigger URL** — build the GHL automation (Email action) that sends to the contact
    and give me its `https://services.leadconnectorhq.com/hooks/.../webhook-trigger/...` URL. A **new**
    trigger UUID is needed; the three existing ones are WhatsApp/SMS. *(Blocking for S5.)*
22. **Postgres DDL** — can you run the `solar_london_quotes` DDL in the database that holds
    `Launchops_chat_memory`, or is there another route you prefer? *(Blocking for S0.)*
23. **Supabase check** — does `Supabase account f1` hold a **service-role** key or an anon key? Only a
    service-role key can upload a PDF to Storage. This decides route B1 vs B2 (§6.3).
24. **`htmlcsstopdf`** — may I install `n8n-nodes-htmlcsstopdf` if it is missing, or do we ship B1 (HTML
    email, no attachment)? *(Default: ship B1, do not install anything.)*
25. **Supabase Storage bucket** — if we do B2, do you want a bucket created, and do you accept a
    time-limited signed URL rather than a public bucket?
26. **Is there a live dashboard deployment for Solar London**? If yes, its URL, so S8 can run. If no,
    S8 is skipped and recorded as skipped.

### 17.5 Not blocking, but I will proceed without an answer

27. Whether the **Intro lane** should also be able to quote (it currently has no quote tool — only
    `AI Conversation Agent` does). Default: no, which keeps this change to one agent.
28. Whether **quote lines should be capped** in chat (e.g. max 4 lines before Amy summarises). Default:
    no cap, since the catalog is small.

---

## 18. Appendix B — the failure signature reference (from the playbook, for the Builder)

| failure signature | cause | fix |
|---|---|---|
| `400 event_type is required` | body sent as a JSON **string** — "Specify Body" is on **Using Parameters** | switch to **Using JSON** (dashboard nodes only) |
| saved row has literal `{{ ... }}` text | body field not resolving expressions | click **fx** on the body field, re-paste |
| events never arrive | workflow not Saved or not Active | Ctrl/Cmd+S after every node change; confirm `active=true` |
| "unrecognized node type" on a node | community package not installed | §7 |
| agent never calls the quote tool | price question stolen by `Classify (Human/AI)`, or the tool description is too vague | §8.2, §8.4 |
| agent states a number not in the tool result | grounding rule not appended, or a number leaked from prose | §9, re-check `Guard Summary` |
| two emails for one conversation | `Insert Quote Intent` moved after the send node | §10.2 ordering requirement |

## 19. Appendix C — v2 option: Postgres-backed catalog

If Raymon wants to change prices without editing workflow JSON, move `CATALOG` to a
`solar_london_catalog` table (same DDL-run-by-Raymon constraint), have `Load Catalog` read it with the
`Postgres account` credential, and keep `catalog_checksum` as a content hash rather than a literal so
drift is still detectable. Not built in v1; recorded so the decision is a known option rather than a
re-architecture.

## 20. Appendix D — rollback

Both workflows ship `active=false`, so rollback at any point before S9 is: deactivate the workflow in
n8n and re-import the dated export from S2 (and the S9 export after that). **Take the S2 exports before
touching anything.** No other system depends on this build, so rollback has no blast radius beyond
these two workflows.
