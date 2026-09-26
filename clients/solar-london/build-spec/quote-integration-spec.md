# Build Spec — Solar London: Text Agent + Quote Sub-Workflow as One System

| | |
|---|---|
| **Client slug** | `solar-london` |
| **Spec version** | **2.0** — full rewrite of v1.0 after `qa-infrastructure-report.md` FAIL (13 blocking, 9 major) and after Raymon's fresh live exports |
| **Date** | 2026-09-26 |
| **Author** | Infrastructure Agent |
| **Status** | For QA (Infrastructure) re-review → Leader → Builder Agent |
| **Supersedes** | v1.0 of this file, in full |
| **Companion document** | `clients/solar-london/build-spec/text-agent-node-inventory.md` — the 64-node keep/delete/apply list. **Read it first. It is the most important deliverable of this pass.** |
| **Change of kind** | This is a **clean-up + rebuild**, not an addition. See §3. |

### What changed from v1.0, in one table

| Was | Now | Why |
|---|---|---|
| Build = add a tool to the text agent | Build = **delete 21 nodes from the text agent**, restore the 43-node core, then add 1 node | The live text agent already contains the entire 19-node quote workflow pasted inside it, wired behind a credential-less `HubSpot Trigger` second entry point. It cannot run. |
| Quote PDF emailed, via GHL outbound webhook | Quote as a **styled HTML email via the `gmail` node**; no PDF in v1 | The GHL private integration token could not be validated, and the GHL node that would use it has no credential. |
| Quote table in the Postgres DB holding `Launchops_chat_memory` | Quote table in **Supabase**, accessed over PostgREST | Dissolves the `$1` parameter problem and every SQL-injection surface. §7.3. |
| Prices `"TBD"` = a blocker | Prices `"TBD"` = **a shipping state** | The system is complete and safe today, and starts quoting the moment Raymon fills the numbers in. §4.4. |
| 28 open questions, 6 build-blocking | **19 open questions, 3 build-blocking.** The rest are filled in this pass. | v1.0 asked Raymon for things this pass now decides from the live exports. |

---

## 1. Artifacts in scope

| Artifact | n8n ID | Live state | Evidence file |
|---|---|---|---|
| Text agent `Conversion0S \| Agent1` | `On1AWVSePFTjQfIt` | `active=false`, **64 nodes** | `build-spec/text-agent-LIVE.json` |
| Quote workflow `LaunchOps Quoting Workflow` | `9lYm64rYASjJm11j` | `active=false`, 19 nodes | `build-spec/quote-workflow-LIVE.json` |

Both evidence files are pulled from the live instance on 2026-09-26 and are the **authoritative**
description of the current state. They are retained unmodified as the audit record. Nothing in this
build may be derived from the older `Downloads/` review export, which has 43 nodes and predates the
paste.

### 1.1 The one number that matters

```
text-agent-LIVE.json      64 nodes
quote-workflow-LIVE.json  19 nodes
```

All 19 quote-workflow node names are present in the text agent by name, and the quote workflow
contains **zero** nodes absent from the text agent. The paste is complete. One additional pasted
node, `Get a contact`, exists in the text agent only. Per-node verdicts are in
`text-agent-node-inventory.md`.

> **What these two files are, and what they are not.** They are the **read-only evidence baseline**
> for this pass: the state of the client's own workflow *before* any edit, kept in the repo so the
> 64-node inventory, the §12.3 check-E/check-F greps and every node-count assertion can be re-run by
> anyone without live n8n access. Treat them as an archaeological record — **never edit them, and never
> paste from them.**
>
> They are **not** the S2 rollback point. S2 takes its own **fresh, dated** export of the live text
> agent before deleting anything; that dated file is the only thing anyone may roll back to. The
> undated files here will drift out of date the moment anyone touches n8n, which is exactly why §7.1.1
> exists for the catalog — this pair is history, not a live source.

---

## 2. Currency

> **Currency: GBP (£).**

Stated once, here, as a fact of this spec. It is **not** derived from Raymon's decision 4 — decision
4 was *delivery by email*. Every `currency` field in the catalog is the literal string `GBP`, the
money format is `£`, and no other currency appears anywhere in the build.

---

## 3. Target architecture — clean up first, then add

```
GHL form fill
     │  POST e94670d8-d66d-499f-9460-f00e6cbd1fa1
     ▼
   Set Contact ID                    ← core, unchanged
     ▼
   Switch  (body.customData['AI Type'])
     ├─ Intro        → Chat Memory Manager1 → AI Intro Message Agent → Segment Response1 → HTTP Request  (GHL)
     ├─ Conversation → Chat Memory Manager  → Classify (Human/AI)
     │                                      ├─ Human → HTTP Request2 (GHL handoff)
     │                                      └─ AI    → AI Conversation Agent  ◄── ai_tool ──┐
     │                                                   │  calls when the lead asks for price │
     │                                                   ▼                                     │
     │                                       [NEW] solar_london_quote  (toolWorkflow) ────────┘
     │                                                   │
     │                                    ┌──────────────▼──────────────────────────────────────┐
      │                                    │  "LaunchOps Quoting Workflow"  — SEPARATE WORKFLOW  │
      │                                    │  built from scratch, never pasted into the text    │
      │                                    │  agent. Execute Workflow Trigger                   │
      │                                    │  → Validate Input                                  │
      │                                    │  → CLAIM QUOTE  (atomic write-ahead, status=pending)│
      │                                    │      1 row → own it  │  0 rows → reclaim-or-dupe   │
      │                                    │  → Load Catalog (checksum) → Match + PRICE          │
      │                                    │  → IF Priced OK? ─no─► Mark Blocked → Return:Blocked │
      │                                    │       │ yes                                          │
      │                                    │  → Quote Summary AI (prose) → Guard Summary         │
      │                                    │  → Build Quote Document → Contract Check            │
      │                                    │  → Send Quote Email (GMAIL NODE)                    │
      │                                    │  → Mark Emailed → Return: Priced + Emailed           │
     │                                    └──────────────┬──────────────────────────────────────┘
     │                                                   │ { ok, needs_human, quote_rows_text, total, emailed }
     │                                        (tool result back to the agent)
     ▼
   Segment Response → HTTP Request1 → GHL   ← UNCHANGED. Every lead message, quoted or not.
```

**Two hard architectural rules.**

1. **The quote sub-workflow has no path that sends a chat message.** The only outbound chat path in
   the entire system remains `AI Conversation Agent → Segment Response → HTTP Request1 → GHL`. The
   quote returns **data**; the agent's existing reply path delivers it.
2. **The quote sub-workflow is a separate workflow and is never pasted into the text agent.** The
   failure this pass exists to repair was caused by exactly that. The text agent receives exactly one
   new node: `solar_london_quote`, a tool pointer.

---

## 4. Pricing — `"TBD"` is a shipping state, not a blocker

Raymon's only price datum, verbatim:

> "it depends on what the person pick it a solar panel let say it about 6k pounds"

**That is the entire price input.** It is ambiguous in at least four ways: per *panel*, per
*install*, or a lead budget? VAT-inclusive? A real list price or a conversational illustration? Home
or commercial?

### 4.1 Hard rules

1. **NEVER invent, infer, round, extrapolate, or "reasonably assume"** any solar price, discount, VAT
   rate, turnaround, panel wattage, capacity, finance rate, or payment term. Not in the catalog, not
   in a default, not in an example, not in a sample payload, not in a test fixture, not in a comment,
   not in a prompt.
2. **No business number is authored in this spec.** Every price-bearing field in
   `catalog-template.json` is the literal string `"TBD"`. The only numbers written in this spec are
   **structural** — node counts, field names, regex digit-counts, HTTP shapes — and each is
   labelled as such. Every *policy* number (max quantity, max attempts, stale-claim timeout, chat
   line cap) lives in `catalog-template.json` under `policy`, with one owner, so the spec prose and
   the catalog can never disagree.
3. The `"TBD"` sentinel is **load-bearing**. The pricing Code node parses every money field with
   `/^\d{1,9}(\.\d{1,2})?$/`. `"TBD"` fails that parse, and a failed parse is the abort trigger. The
   system **cannot** emit a quote from an unresolved price, even by accident.

### 4.2 The 6k statement may not be used as anything

It is recorded in `facts-template.json` as `pricing.source_quote_verbatim` — **provenance of an open
question**. It is not parsed into any catalog row, and it must not be used to sanity-check, round,
bound, or order a future Raymon-supplied price.

### 4.3 The fail-loud abort, fully specified

When a requested service's price is `"TBD"`, the sub-workflow **does not quote**. It:

1. sets `ok: false`,
2. sets `needs_human: true`,
3. sets `status: "blocked_tbd"`,
4. sets `failure_reason: "catalog_price_tbd:<key>"`,
5. returns `lead_line` = the verbatim handoff literal (§9.2),
6. sends **no email**,
7. records a `blocked_tbd` row in Supabase (§7.3),
8. emits a `quote_blocked` dashboard event if a dashboard URL exists (§7.4).

The agent then replies in Amy's own voice, from the §9 systemMessage block, saying she is checking
with her manager. The lead never learns that a price database is incomplete — that is deliberate.

### 4.4 **This is the shipping state, and it is not a defect.**

The system is **complete and safe today**. Every node, every branch, every terminal, the abort
guard, the claim/duplicate guard, the email path and the content check are built and tested while
every price is `"TBD"`. What the Builder demonstrates in that state is:

- the matcher runs and finds the row,
- the strict price parse rejects `"TBD"`,
- the abort fires and returns `needs_human: true`,
- the write-ahead claim is inserted with `status: 'pending'` and immediately moved to
  `status: 'blocked_tbd'`,
- **no email is sent**,
- the terminal object carries no number of any kind,
- the `quote_blocked` event lands.

The moment Raymon writes a real figure into `unit_price` and recomputes `catalog_checksum`, the same
graph emits the quote and sends the email. **No code changes, no node changes, no re-wiring.** The
Builder must **not** treat `"TBD"` as a reason to stop, to stub, or to defer a stage. Building and
verifying the abort path *is* the deliverable.

### 4.5 Services that can be quoted today

Every proposed business row ships with `active: false` and `customer_facing: false`, because Raymon
has not yet confirmed which services Solar London sells (§16 Q11). Setting any of them `true` would
be asserting scope this spec does not have.

To keep the machinery demonstrable without inventing a Solar London service, the catalog ships one
**reserved-namespace self-test row**:

| Field | Value |
|---|---|
| `key` | `_self_test_solar_row` |
| `display_name` | `SELF TEST ROW - NOT A SOLAR LONDON SERVICE` |
| `category` | `installation` |
| `install_type` | `both` |
| `pricing_model` | `"TBD"` |
| `unit_price` | `"TBD"` |
| `active` | **`true`** |
| `customer_facing` | **`false`** |
| `requires_quote_id` | `true` |

**This resolves the contradiction QA raised.** `active` and *printable* are two different questions,
and they are now two different fields:

- `active: true` — the matcher will accept this row. The system needs at least one such row or no
  branch of the graph past `Match + Price Quote` can ever be exercised. The self-test row provides it.
- `customer_facing: true` — the row may be printed on a customer-facing document. **No** business row
  is `customer_facing: true` until Raymon confirms it.

Because the self-test row's price is `"TBD"`, it **always aborts**, so it can never produce a figure
for anyone. And because it is `customer_facing: false`, the content check in §12.3 **rejects** any
document in which its `display_name` appears. It is a machinery probe, not a service. The leading
underscore reserves the namespace so a real key can never collide with it.

---

## 5. The quote sub-workflow — the complete v1 graph

Built from scratch in a **separate workflow** named `LaunchOps Quoting Workflow`. The 19 nodes in
the live copy of that workflow are **not** reused; per-node verdicts are in the inventory file §3.2.
Goal: CRM-agnostic, one `ai_tool` entry point, every number computed in code, no LLM-produced
number, **no `Merge` node**, every path ending in a `Return:` Set node.

### 5.1 Structural patterns used throughout

These four patterns are what make the graph safe. They are rules, not suggestions.

**P1 — every Code node re-emits the whole accumulated contract.** n8n Set nodes drop fields, so a
chain of Set nodes silently shreds the payload. Instead each Code node reads the nodes before it by
name via `$('Node Name')` and returns the full object plus its own contribution. Nothing is carried
forward implicitly. This removes the need for a `Merge` node entirely.

**P2 — every `Return:` Set node has `Keep Only Set Field` ON.** The catalog constant, the checksum,
the raw catalog row JSON, and every intermediate field are physically incapable of surviving into the
tool result. Without this, the model can read the whole catalog and the checksum, and can echo either
back to the lead. The Set node's `assignments` list every field of the return contract explicitly, so
`Keep Only Set Field` has an explicit field set to keep.

**P3 — one atomic claim gates the entire attempt, and it is taken BEFORE any pricing.** A single
`Claim Quote` insert with `Prefer: resolution=ignore-duplicates,return=representation` is the only
gate. It returns one row → this run owns the attempt. It returns zero rows → another run owns it, and
this run **never prices and never sends**.

The claim sits immediately after `Validate Input`, *not* after pricing, and that placement is
load-bearing for three reasons:

1. **It is the write-ahead.** A crash anywhere after the claim leaves a visible `pending` row. A claim
   taken after pricing would leave a crash during pricing invisible — the run would have emailed
   nothing and recorded nothing, which is the silent-gap class this whole spec exists to remove.
2. **It makes §4.3 and §4.4 literally true.** The TBD branch can be recorded as a real row that moves
   `pending → blocked_tbd`, instead of returning a status no table ever received.
3. **It is what makes the reclaim path in §8.3 possible at all.** A reclaim must resume the attempt
   from the *start* of the deterministic work. With the claim taken up front, reclaim is a single
   conditional `UPDATE` and the run continues forward down the same linear graph — no loop, no
   `Merge`, no re-entry into a node that has already run. With the claim taken after pricing, reclaim
   would have to jump backwards to re-price, and the re-insert would then conflict with the row the
   reclaim had just updated. The two designs cannot be mixed, and this one is the coherent one.

Every terminal after the claim therefore owes exactly one status update, so the graph maintains a
single invariant: **one claim, one row, exactly one terminal status, on every path.**

**P4 — free text travels in a request body; only regex-validated tokens travel in a filter.** Email
addresses, names, companies, quote rows and summaries are JSON body values. The only values in a
URL filter are the SHA-256 idempotency digest and the `contact_id`, both regex-validated immediately
before use (§7.3). There is no SQL text in this build.

### 5.2 The v1 node list — complete, in build order

**33 nodes: 23 functional, 10 terminals** — 32 while node 18 is deferred. Read the table as the build
order and the connection order together — there is no second source of truth for the wiring.

| # | Node | Type | Purpose | Fails loud how |
|---|---|---|---|---|
| 1 | `When Executed by Another Workflow` | `base.executeWorkflowTrigger` | Flat input schema (§5.3) | — |
| 2 | `Validate Input` | `base.code` | Required fields; `email` shape; `currency === 'GBP'`; `quantity` bounds (§5.4) | `ok:false, status:'bad_input'` → node 2R |
| 2R | `Return: Bad Input` | `base.set` **Keep Only Set Field ON** | Terminal. A malformed tool call never attempted a quote, so it writes **no** row | → node 18 |
| 3 | `Claim Quote` | `base.supabase` / `base.httpRequest` → PostgREST | **The atomic write-ahead, taken before any pricing.** `status:'pending'`, `attempt:1`, `quote_id` (§7.3, §8) | 0 rows returned → node 4 |
| 4 | `Load Stored Outcome` | `base.supabase` / `base.httpRequest` → PostgREST | Selects the existing row by the regex-validated `idempotency_key`. Read-only | — |
| 5 | `IF Reclaimable?` | `base.if` | Stored row is stale `pending`, or `blocked_tbd` / `failed_document` / `failed_email`, **and** `attempt < policy.idempotency.max_attempts` | true → node 5R; false → node 4R |
| 5R | `Reclaim Quote` | `base.supabase` / `base.httpRequest` → PostgREST | Conditional `UPDATE … SET attempt = attempt + 1, status = 'pending' … WHERE id = <id> AND status IN (…) RETURNING *`. The status guard in the `WHERE` is what makes the reclaim itself race-free | 0 rows → node 4R (lost the race) |
| 4R | `Return: Duplicate — Not Resent` | `base.set` **Keep Only Set Field ON** | Terminal. Returns the **stored** row's numbers, `duplicate:true`, `emailed:<stored>`. **No email.** Covers "already emailed", "in flight", "attempt cap reached" and "lost the reclaim race" — four outcomes that all mean the same thing: *this run does not send* | → node 18 |
| 6 | `Load Catalog` | `base.code` | Emits `CATALOG`, and verifies it against the **separately pasted** `EXPECTED_CHECKSUM` per §7.1.1 | mismatch → node 6D |
| 6D | `Mark Catalog Drift` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the claimed row `pending → catalog_checksum_mismatch`, records **both** digests. A separate node rather than an update inside the return, because `base.set` cannot write to Postgres and a `Return:` that skips the write strands the row in `pending` forever | — |
| 6R | `Return: Catalog Drift` | `base.set` **Keep Only Set Field ON** | Terminal. `status:'catalog_checksum_mismatch'`. The run **aborts**: it does not price, does not email, does not fall back to the repo file. `failure_reason` names the node and both checksums | → node 18 |
| 7 | `Match + Price Quote` | `base.code` | The one deterministic pass (§5.5): exact `key` match, `active` only, install-type guard, wattage guard, strict money parse, quantity maths, `subtotal_minor`, `total_minor`, `price_ledger`, `quote_rows_text`. **No LLM in this node** | no match → node 7N; unresolved price → node 8M |
| 7N | `Mark No Matching Service` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the claimed row `pending → no_matching_service`, records the unmatched keys verbatim. Same reason as node 6D: the claim already happened, so something must close the row | — |
| 7R | `Return: No Matching Service` | `base.set` **Keep Only Set Field ON** | Terminal. `status:'no_matching_service'` | → node 18 |
| 8M | `Mark Blocked (TBD)` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the claimed row `pending → blocked_tbd` and records `failure_reason` | — |
| 8R | `Return: Blocked — Price TBD` | `base.set` **Keep Only Set Field ON** | Terminal, **and the normal state today.** `status:'blocked_tbd'`, `needs_human:true`, **no number in the object, no email** | → node 18 |
| 9 | `Quote Summary AI` | `lc.chainLlm` + `OpenAI Chat Model` (`OpenAI account`, `gpt-4.1`, temperature 0) | One customer-facing sentence. **Prose only.** Receives only the already-priced rows, never the catalog | `On Error: Continue (error output)` → node 10 |
| 10 | `Guard Summary` | `base.code` | Whitelist-and-bind digit filter (§5.6). Handles the error input from node 9: no LLM text → `summary_text:null, summary_failed:true`, and the run continues on the deterministic line with the failure written to the row | — |
| 11 | `Build Quote Document` | `base.code` | Builds the quote HTML body, the plain-text chat block and the `price_ledger` array (§12.3). Scans for unresolved expressions and placeholder tokens | any token survives → node 11M |
| 11M | `Mark Failed (Document)` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the row `pending → failed_document`, records the offending token | — |
| 11R | `Return: Bad Document` | `base.set` **Keep Only Set Field ON** | Terminal. `status:'failed_document'` | → node 18 |
| 12 | `Contract Check` | `base.code` | The forward binding (§5.6). Asserts all 14 contract fields are present, no unexpected key exists, every digit-group in the outgoing object is in the priced set, and `subtotal_minor === total_minor` | any assertion fails → node 12M |
| 12M | `Mark Contract Violation` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the row `pending → contract_violation`, records the failed assertion | — |
| 12R | `Return: Contract Violation` | `base.set` **Keep Only Set Field ON** | Terminal | → node 18 |
| 13 | `Send Quote Email` | `base.gmail` (§6.5) | Delivery. Recipient is the validated `email` input. **The only node in this build that sends anything** | `On Error: Continue (error output)` → node 14 |
| 14 | `IF Email OK?` | `base.if` | Checks the Gmail node's returned message id, not merely that the run continued | true → node 15; false → node 14M |
| 14M | `Mark Failed (Email)` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the row `pending → failed_email`, records the node name and the n8n error message | — |
| 14R | `Return: Failed — Email` | `base.set` **Keep Only Set Field ON** | Terminal. `status:'failed_email'`. The lead gets nothing by email, which is why `lead_line` still says a human is checking | → node 18 |
| 15 | `Mark Emailed` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the row `pending → emailed`, sets `emailed_at = now()` | `On Error: Continue (error output)` → node 16; the failure is recorded and surfaced, the email already went out |
| 16 | `Return: Priced + Emailed` | `base.set` **Keep Only Set Field ON** | Terminal, **and the only success output** | → node 18 |
| 17M | `Mark Internal Error` | `base.supabase` / `base.httpRequest` → PostgREST | Moves the row `pending → internal_error` and records the n8n error message. **Target of the n8n Error Workflow**, which is why that workflow is a required node and not an optional extra | — |
| 17R | `Return: Internal Error` | `base.set` **Keep Only Set Field ON** | Terminal. Also the target of any `On Error: Continue` path whose destination is not already listed. `status:'internal_error'`, `needs_human:true` | → node 18 |
| 18 | `Dashboard - Quote Outcome` **_(stage-gated, §16.1b Q28)_** | `base.httpRequest` | One node, the target of **all ten** terminal nodes — but **only if Raymon has supplied a live dashboard URL**. With no URL, do not create it: every `Return:` node simply ends there, and S8 is recorded **skipped with the reason**. Posts `quote_generated` or `quote_blocked` (§7.4). `On Error: Continue` — the quote is already decided, and a failed telemetry POST must not change that | — |

**Node arithmetic for QA.** 23 functional (`1, 2, 3, 4, 5, 5R, 6, 6D, 7, 7N, 8M, 9, 10, 11, 11M, 12,
12M, 13, 14, 14M, 15, 17M, 18`) + 10 terminals (`2R, 4R, 6R, 7R, 8R, 11R, 12R, 14R, 16, 17R`)
= **33** — or **32** while node 18 is deferred, which is the expected count until Q28 is answered.
Count the table rows before claiming the build is complete; a miscount here is a missing node, and
every `Mark…` node is load-bearing rather than decorative.

> **Naming.** `R` suffix = a `Return:` terminal. `M` suffix = a `Mark…` node that closes the row. `D`
> and `N` are the one-offs (`Mark Catalog Drift`, `Mark No Matching Service`). `M` was chosen over
> `W` deliberately: this spec discusses **watts** in the same breath as these node numbers, and a node
> called `8W` sitting beside a per-watt guard is a misreading waiting to happen.

**The row invariant, stated once.** `Claim Quote` (node 3) is the only place a row is created, and
the only two paths that create no row at all are `Return: Bad Input` (2R — the request was never well
formed) and `Return: Duplicate — Not Resent` (4R — a row already exists and this run does not own
it). Every other path runs through **exactly one** of these eight `Mark…` nodes, each of which is a
Supabase write and each of which is the *only* writer for its status:

`Mark Catalog Drift` (6D) · `Mark No Matching Service` (7N) · `Mark Blocked (TBD)` (8M) ·
`Mark Failed (Document)` (11M) · `Mark Contract Violation` (12M) · `Mark Failed (Email)` (14M) ·
`Mark Emailed` (15) · `Mark Internal Error` (17M)

So: **no path creates a row and leaves it in `pending`**, and **no path reaches a terminal after the
claim without closing the row**. A Builder who cannot point at the `Mark…` node that closes a given
terminal has built it wrong — and the way that failure shows up is a row stuck in `pending` that
nothing ever revisits, which is precisely the class of silent stall this rewrite exists to remove.

> **This is why the `Mark…` nodes exist separately from the `Return:` nodes.** An earlier draft of this
> spec had `Return: Catalog Drift`, `Return: No Matching Service` and `Return: Internal Error` closing
> their own rows. They cannot: a `base.set` node does not talk to Postgres, and it is the only node
> type that can produce the exact 14-field contract the tool must return. A `Return:` that skips the
> write strands the row. Hence 33 nodes instead of 30 — three extra writes, bought with the
> guarantee that no row is ever orphaned. Do not "simplify" these away.

**There is no `Merge` node and there is no loop in this graph.** Linear, acyclic, ten terminals, one
shared telemetry target. A failure on any branch can never leave a node waiting for an input that
will not arrive — which was the root cause of the silent stall in the old design.

**The full no-PDF graph is this table.** There is no `Render PDF`, no `Fetch PDF`, no `Store PDF`, no
`IF PDF OK?` in v1, so there is no "route B" for the Builder to have to invent. §16.1 documents the
PDF tail as v1.1 with its own separate node list, clearly marked not built.

### 5.3 `When Executed by Another Workflow` — input schema

Use the node's newest available typeVersion. If it offers **JSON Schema** input mode use it; if the
instance only offers the older **Input Data** field list, create the same fields there and record
which mode was used in the build report. Do not guess the `type` enum — pick from what the node
actually offers and record it.

| Field | Type | Required | Description text to use in the tool | Validation |
|---|---|---|---|---|
| `contact_id` | string | **yes** | The GoHighLevel contact id for this conversation. Set the field default to the expression `={{ $('Set Contact ID').item.json['Contact ID'] }}` | `/^[A-Za-z0-9_-]{1,64}$/` |
| `contact_name` | string | no | The customer's name as it should appear on the quote | non-empty if present, max length cap |
| `email` | string | **yes** | The customer's email address, exactly as it is on their GHL contact record | `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` — see §6.6 |
| `company_name` | string | no | Their company. Leave empty for a home install | — |
| `install_type` | string | **yes** | `home` or `commercial` | exact enum |
| `requested_services` | string | **yes** | Comma-separated **catalog keys**. Never free text, never a sentence | split/trim, each must match a catalog key |
| `quantity` | string | no | The number of identical units the customer said, **digits only**, no unit word, no decimal point | §5.4 |
| `conversation_notes` | string | no | One short factual line on what they asked for. Document use only. **Never parsed for a price** | — |
| `currency` | string | **yes** | `GBP` | must equal `GBP` or abort |

`requested_services` is a **comma-separated string**, not an array: it maps cleanly onto both node
input modes, avoids array-type ambiguity across n8n versions, and is easier for the agent to fill
correctly than a JSON array. `Match + Price Quote` does the splitting with a strict trim and exact match.

`quantity` is typed **string**, not number, on purpose — a string is what lets the workflow *refuse*
a malformed value instead of coercing it. See §5.4.

### 5.4 `Validate Input` — quantity, and why it is a string

`quantity` is model-supplied. v1.0 accepted it as a number with a `?? 1` default, which permitted
zero and capped nothing, so a hallucinated quantity silently re-priced the quote. Fixed:

```
raw = input.quantity                      // may be undefined, '', or any string

if (raw === undefined || raw === null || String(raw).trim() === '')
      -> quantity = null                  // absent is legitimate: no count was stated
else
  s = String(raw).trim()
  if (!/^[1-9][0-9]{0,2}$/.test(s))        // 1-3 digits, no leading zero, no sign, no dot, no unit
        -> ok:false, status:'bad_input',
           failure_reason:'quantity_malformed'          // REFUSE, never repair, never default
  n = parseInt(s, 10)
  if (n < policy.quantity.min)            -> ok:false, 'quantity_below_min'
  if (policy.quantity.max === 'TBD') {
      // While the cap is unconfirmed the effective cap IS the floor, so a multi-unit
      // request is refused rather than priced on an unconfirmed bound.
      if (n > policy.quantity.min)
          -> ok:false, status:'bad_input',
             failure_reason:'quantity_above_max_tbd'    // resolves the instant Raymon sets a max
  } else if (n > policy.quantity.max)     -> ok:false, 'quantity_above_max'
```

`policy.quantity.min` and `policy.quantity.max` live in `catalog-template.json` under `policy`. The
Builder reads them from the catalog constant; they are never hardcoded in a node. **Refuse, never
default.** There is no `?? 1` anywhere in this build.

### 5.5 `Match + Price Quote` — one Code node, one deterministic pass

The match, the guards, the pricing and the ledger build are **one** `base.code` node. Folding them is
deliberate: a split would need `Merge` or implicit field carry-forward between Set nodes, and both are
how the old design silently shredded its payload.

The deterministic pass, in this exact order:

```
catalog   = CATALOG
if (sha256(canonicalJson(catalog)) !== catalog.catalog_checksum)
      -> ok:false, status:'catalog_checksum_mismatch', failure_reason:'catalog_checksum_mismatch'
      // Defensive only. `Load Catalog` already compared it. A mismatch here means the
      // constant was edited without recomputing the checksum, so abort rather than quote.

keys      = requested_services.split(',').map(s => s.trim()).filter(Boolean)
matched   = keys.map(k => catalog.services.find(s => s.key === k && s.active === true))
if (matched.some(m => m === undefined))
      -> ok:false, status:'no_matching_service',
         failure_reason:'no_matching_catalog_service:' + <the unmatched keys, verbatim>

lines = []
for (row of matched) {
  if (row.install_type !== 'both' && row.install_type !== install_type)
        -> ok:false, status:'no_matching_service',
           failure_reason:'service_install_type_mismatch:' + row.key

  // --- the wattage trap, closed -------------------------------------------------
  // unit_size is a CATALOG value. The model never supplies it and never influences it.
  // It gets its OWN regex. It is NOT parsed with the money regex.
  if (row.pricing_model === 'per_watt') {
        if (row.unit_size_unit !== 'W')
              -> ok:false, status:'blocked_tbd',
                 failure_reason:'catalog_unit_size_unit_tbd:' + row.key
                 // 'kW' is rejected here, NOT silently multiplied up to watts. Converting
                 // kW to W is arithmetic Raymon has not authorised, and guessing it
                 // under-prices a system by a factor of one thousand.
        if (!/^[1-9][0-9]{1,4}$/.test(String(row.unit_size)))
              -> ok:false, status:'blocked_tbd',
                 failure_reason:'catalog_unit_size_invalid:' + row.key
                 // INTEGER watts only, no decimal point. A catalog value of "3" for a
                 // three-kilowatt array therefore FAILS validation and aborts, instead
                 // of pricing a three-kilowatt system at three watts.
  }
  // ---------------------------------------------------------------------------

  price = parseMoneyStrict(row.unit_price)        // /^\d{1,9}(\.\d{1,2})?$/
  if (price === null)
        -> ok:false, status:'blocked_tbd',
           failure_reason:'catalog_price_tbd:' + row.key                // <-- THE ABORT

  // The print gate runs AFTER the money parse, and that order is deliberate. It looks like it
  // should sit with the other match guards, but if it ran first the self-test row would be
  // rejected as bad_input and could never reach the abort below - so the TBD path, the one
  // branch that must be demonstrable today, would be untestable. Running it here is safe: a
  // row that cannot price aborts before any document exists, and a row that CAN price is still
  // refused before it reaches `lines`, so a non-customer-facing row can never be printed.
  if (row.customer_facing !== true)
        -> ok:false, status:'bad_input',
           failure_reason:'service_not_customer_facing:' + row.key

  if (!['yes','no','TBD'].includes(row.vat_included))
        -> ok:false, status:'bad_input', failure_reason:'catalog_vat_invalid:' + row.key
  if (row.vat_included === 'TBD')
        -> ok:false, status:'blocked_tbd', failure_reason:'catalog_vat_tbd:' + row.key

  switch (row.pricing_model) {
    case 'flat':      minor = price;                        break
    case 'per_unit':  if (quantity === null)
                            -> ok:false, status:'bad_input',
                               failure_reason:'quantity_required_for:' + row.key
                      minor = price * quantity;              break
    case 'per_watt':  if (quantity === null)
                            -> ok:false, status:'bad_input',
                               failure_reason:'quantity_required_for:' + row.key
                      minor = Math.round(price * parseInt(row.unit_size, 10) * quantity)
                                                             break
    default:          -> ok:false, status:'blocked_tbd',
                       failure_reason:'pricing_model_tbd:' + row.key
  }
  lines.push({ key, display_name, unit_price_minor: price, minor, qty, unit_label })
}

subtotal_minor = lines.reduce((a, l) => a + l.minor, 0)   // integers only
total_minor    = subtotal_minor                          // v1 has no document-level adjustment
price_ledger   = lines.map(l => ({ key: l.key, display_name: l.display_name,
                                   unit_price_minor: l.unit_price_minor, qty: l.qty,
                                   line_total_minor: l.minor,
                                   line_total_display: formatGBP(l.minor) }))
quote_rows_text = lines.map(l => onePlainTextLine(l)).join('\n')   // built here, not by the LLM
```

**The ledger carries `unit_price_minor` on purpose.** It is the forward binding that check B in §12.3
verifies: every figure printed on a document must reduce back to a `unit_price` in the catalog, and the
ledger is the record of that reduction. A ledger that only stored the line total would prove that a
number was *added up* correctly, not that it came from the catalog.

**Money is never a float.** Every price is parsed to **integer minor units (pence)**, summed as
integers, and formatted only for display. `formatGBP` is the single formatter in the build. The
customer-facing line is already correct before the agent sees it.

`subtotal_minor` **is produced** — it is the sum of the line totals, computed here, and it is
written to the row and asserted by `Contract Check`. In v1 `total_minor === subtotal_minor` because
there is no document-level adjustment. If Raymon later adds a discount or a VAT line,
`total_minor = subtotal_minor + adjustments_minor` and the `Contract Check` assertion changes
accordingly. The column is not decorative and no node leaves it null.

### 5.6 `Guard Summary` and `Contract Check` — the LLM owns no number

Decision 5 keeps OpenAI, but only for **prose**. Two enforcement stages, and the second one is the
forward binding v1.0 lacked.

**Stage 1 — `Guard Summary` (whitelist, not just strip).**

1. Build the exact set of digit-groups in the priced fields: every `line_total_display`, `total_display`, and every `subtotal_minor`/`total_minor` rendered.
2. The AI sentence must contain **no** digit-group outside that set. If it does — or if it contains `£`, `GBP`, `%`, or the substring `TBD` — **discard the sentence entirely** and set `summary_text: null`.
3. The deterministic `lead_line` is used instead.
4. A discarded summary is **not an error**. It is expected occasionally and is harmless.
5. If node 9 handed over its error output instead of text, set `summary_text: null, summary_failed: true` and continue. The run does not die because a sentence could not be written; the failure is recorded in the row, which is what makes it loud.

**Stage 2 — `Contract Check` (forward binding).** Runs immediately before every success terminal and
re-reads the whole outgoing object. It asserts, and **aborts the run** on any failure:

- all 14 contract fields in §5.7 are present;
- **no key outside that contract is present** — this is what physically prevents the catalog
  constant, the checksum and any catalog row from reaching the model;
- every digit-group anywhere in `quote_rows_text`, `total_display`, `lead_line` and `summary_text`
  is a member of the priced digit-set — so a number cannot be introduced *after* `Guard Summary` ran;
- `lead_line` contains **no** digit at all (it is a fixed literal, so any digit is a defect);
- `subtotal_minor === total_minor` (§5.5);
- `emailed === true` on the success path and `emailed === false` on every other path. **`ok: true`
  with `emailed: false` is a contract violation**, not a return value.

This is the mechanical version of "the LLM never owns a number": there is no path by which a number
reaches the agent that does not pass through the pricing code and then survive two assertions.

### 5.7 The return contract — 14 fields, every terminal

**Success — `Return: Priced + Emailed`**

```json
{
  "ok": true,
  "needs_human": false,
  "status": "emailed",
  "quote_id": "Q-<YYYYMMDD>-<XXXXXX>",
  "duplicate": false,
  "contact_id": "<the validated contact_id>",
  "services": [{ "key": "<catalog key>", "display_name": "<catalog display_name>" }],
  "quote_rows_text": "<one plain-text line per priced row, built by code, never by the model>",
  "total_display": "<formatted by the single formatter in the build>",
  "subtotal_minor": 0,
  "total_minor": 0,
  "currency": "GBP",
  "emailed": true,
  "lead_line": "let me check that with my manager"
}
```

That is **14 keys**: `ok`, `needs_human`, `status`, `quote_id`, `duplicate`, `contact_id`, `services`,
`quote_rows_text`, `total_display`, `subtotal_minor`, `total_minor`, `currency`, `emailed`,
`lead_line`. Count them in the Set node's `assignments` — a 13-field contract is a missing field, and
`Contract Check` is what catches it.

> The `0` in `subtotal_minor` and `total_minor` above is a **JSON type placeholder** in a shape
> example. It is not a price, a default, or a permitted value. At runtime both are integer sums
> computed from the catalog, or the run has already aborted.

**`lead_line` is the same literal on every failure terminal.** It is a fixed string in the workflow,
not model output, so it cannot be hallucinated and it cannot vary with the failure mode — the lead
must not learn that a price database is incomplete.

> `quote_id` shape is `Q-` + UTC `YYYYMMDD` + `-` + the first six hex characters of
> `sha256(idempotency_key)`. The `XXXXXX` above is a **format placeholder**, not a value. Generation
> is fully deterministic: no random source, no clock beyond the UTC day already in the key, and a
> re-run of the same request produces the same `quote_id`, so a duplicate send would be visibly
> identical.

**Every non-success terminal emits the same 14 keys** with `ok:false`, `needs_human:true`,
`emailed:false`, `quote_rows_text:""`, `total_display:null`, and one of these statuses:

| Terminal | `status` | `failure_reason` shape |
|---|---|---|
| `Return: Bad Input` | `bad_input` | the field that failed |
| `Return: Catalog Drift` | `catalog_checksum_mismatch` | node name + both checksums |
| `Return: No Matching Service` | `no_matching_service` | the unmatched keys, verbatim |
| `Return: Blocked — Price TBD` | `blocked_tbd` | `catalog_price_tbd:<key>` |
| `Return: Bad Document` | `failed_document` | the offending token |
| `Return: Contract Violation` | `contract_violation` | the assertion that failed |
| `Return: Failed — Email` | `failed_email` | node name + the n8n error message |
| `Return: Duplicate — Not Resent` | *(the stored row's status)* | `duplicate:true`, `emailed:<stored>` |
| `Return: Internal Error` | `internal_error` | node name + the n8n error message |

`Return: Duplicate — Not Resent` is one node serving four different stored outcomes, and it echoes the
**stored** `status` rather than inventing one, so the caller can tell a delivered quote
(`emailed`) from an in-flight one (`pending`) from a capped one (`max_attempts_reached`). All four mean
the same thing to the send: **this run does not send.**

`Return: Internal Error` is the target of the n8n **Error Workflow** and of any `On Error:
Continue` path whose destination is not already listed. It is a required node, not an optional extra.

---

## 6. Email delivery — the Gmail node. Decided, not open.

### 6.1 Why the GoHighLevel API is out

Raymon supplied a GHL private integration token. **It could not be validated.** GHL returns an
identical empty `404` for a valid token and an invalid token on every path tried, so there is no
evidence the token works. Building on an unvalidated credential against an API that fails
indistinguishably is exactly the silent-failure class this spec exists to eliminate.

The `Get a contact` node that would have consumed it is worse: `n8n-nodes-base.highLevel`,
`operation: "get"`, `requestOptions: {}`, **no resource or identifier parameters at all, and no
credential assigned**. It is also absent from the `connections` object in the live export — it is
neither a source nor a target. It is a dangling node that could never have run.

**No node in this build calls the GoHighLevel API.** GHL remains the entry point for leads and the
outbound path for chat. The quote email does not go through it.

### 6.2 Decision

> **The quote email is sent by the stock n8n `gmail` node, using a `gmail` OAuth2 credential that
> Raymon creates on the instance. The quote is a styled HTML email body. v1 produces no attachment.**

Reasons: the credential is creatable today from values already in this repo's gitignored `.env`; it
needs no unvalidated third-party API; it removes the community `htmlcsstopdf` dependency from a
production path; and it keeps the build testable end to end while every price is `"TBD"`.

### 6.3 Creating the `gmail` credential — exact steps

**No credential value may ever be written into this spec, into a node, into a workflow export, into
the build report, or into any committed file.** The steps below reference **env var names only**.
The person doing this reads the values from the local gitignored `.env` at the repo root and types
them into the n8n UI. Nothing is copied into a file.

| Step | Where | What to do |
|---|---|---|
| 1 | repo root, shell | Confirm the four var names are present in the gitignored `.env`: `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `GMAIL_REFRESH_TOKEN`. Do not echo, print, copy or paste their values anywhere. Confirm `.env` is in `.gitignore` before continuing. |
| 2 | Google Cloud console | Confirm the OAuth client type is **Web application** and that the Gmail API is enabled on that project. This is a prerequisite for the consent screen to return a refresh token. |
| 3 | n8n | **Credentials → New → Google OAuth2 API**. Name it `Solar London Gmail`. |
| 4 | n8n | **Credential Data → Client ID** ← the value of `GMAIL_CLIENT_ID`. |
| 5 | n8n | **Credential Data → Client Secret** ← the value of `GMAIL_CLIENT_SECRET`. |
| 6 | n8n | **OAuth2 → Redirect URI** — copy the URL n8n displays on this screen and make sure it matches the value of `GMAIL_REDIRECT_URI` in `.env`. They must be the same URI in both places or Google will refuse the exchange. |
| 7 | n8n | Click **Connect**. Complete the consent screen with the Solar London sending account, and grant the Gmail scopes the node needs: send email, and read the sending profile. |
| 8 | n8n | n8n exchanges the code and stores the refresh token in its own credential store. **This is the durable credential.** A refresh token does not expire, so nothing has to be re-entered. |
| 9 | n8n | Confirm the credential shows as **Connected** and that the connected account is the **Solar London sending address on Solar London's own domain** — see §16 Q29. A quote arriving from a personal mailbox is a brand defect. |
| 10 | build report | Record only: the credential **name** (`Solar London Gmail`), the connected account address, the scopes granted, and the date. **Never** the client id, the client secret, the refresh token, or the access token. |

**`GMAIL_ACCESS_TOKEN` is not used as the durable credential.** Access tokens are short-lived and are
replaced automatically by the refresh token. If a stale `GMAIL_ACCESS_TOKEN` value exists in `.env`,
leave it there and ignore it; do not paste it anywhere.

### 6.4 v1 sends no PDF — the no-PDF graph is the only graph

v1 delivers the quote as the **HTML body of the email**: the full priced table, the total, the
quote reference, and the business footer. This removes three dependencies at once — the unverified
`htmlcsstopdf` community package, a Supabase Storage bucket that does not exist, and a signed-URL
policy that would have to be invented. The customer receives every figure in one place, and the
identical figures appear in the chat through the agent's own reply path.

The PDF tail is **v1.1**, documented in §16.1 with its own complete node list, and marked **not
built**. The Builder does not build it, does not stub it, and does not leave half-wired nodes for
it. §5.2 is the complete v1 graph.

### 6.5 `Send Quote Email` — node configuration

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.gmail` |
| Resource / Operation | **Message → Send** |
| Credential | `Solar London Gmail` (§6.3) |
| `To` | `={{ $('Validate Input').item.json.email }}` |
| `From` | `={{ $('Build Quote Document').item.json.from_email }}` — from `document_defaults.sender_email` in the catalog. **If that value is `"TBD"`, the run aborts** with `status:'blocked_tbd'`, `failure_reason:'catalog_sender_email_tbd'`, and **sends nothing.** |
| `Subject` | `Your quote from Solar London - reference <quote_id>` |
| `Message` | `={{ $('Build Quote Document').item.json.quote_email_html }}` — HTML, built by code |
| Options | Attachments: **empty.** v1 has no file. |
| `On Error` | **Continue (using error output)** → `IF Email OK?` |

The quote reference is in the subject line so any misdirected send is traceable to its row on sight.

### 6.6 The recipient is now load-bearing — one rule, not three

v1.0 said email was required, then validated it, then tolerated its absence. Three rules for one
field. There is now exactly one:

> **`email` is REQUIRED. If it is missing, empty, or fails `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`, the run returns `ok:false, needs_human:true, status:'bad_input', failure_reason:'email_missing_or_malformed'` and sends NOTHING. The quote is not emailed, and the customer is not quoted.**

This matters more than it did in v1.0. Under the GHL approach the recipient was resolved by GHL
from the contact id, so a bad email string could not misroute anything. **Under the Gmail node the
address *is* the delivery target**, so the validation is the only thing standing between a
transcription error and a customer's quote landing in a stranger's inbox. It is therefore a hard
gate, not a warning.

**The lead is still answered.** The handoff reply goes out on the normal chat path
(`Segment Response → HTTP Request1 → GHL`), which this project does not touch. A blocked email
never means a silent lead.

**`body.email` is UNVERIFIED.** The live text agent references `body.first_name`,
`body['Message Aggregator']`, `body.contact_id` and `body.customData['AI Type']`. It references
`body.email` **nowhere**. The exact GHL field name that carries the lead's email address has not
been confirmed against a real payload. Stage S3 must capture one real form fill and record the exact
path. If it is not `body.email`, use the real path and record it. **Do not guess a path and do not
fall back to asking the customer for their address in chat** — the §9 block forbids that, and a
chat-typed address is the hallucination this whole design prevents.

### 6.7 Documented alternative — GHL outbound email webhook. **NOT BUILT.**

Retained for the record only, because it is a real option if Raymon later wants the quote to land in
the GHL conversation thread and come from Solar London's own GHL sending domain:

- A new GHL automation with an Email action, and its
  `https://services.leadconnectorhq.com/hooks/<locId>/webhook-trigger/<newUuid>` URL.
- Sent with `n8n-nodes-base.httpRequest`, `Send Body` ON, **Specify Body: Using Parameters** — which
  is what the four existing nodes use, and the wrong choice ("Using JSON") is a documented failure
  mode. The dashboard webhook is the opposite case and needs "Using JSON".
- The three existing triggers on location `Led6m5lQlg4mLFp0cFdg` are WhatsApp/SMS and **must not be
  reused**; a new trigger gets a new UUID, which Raymon must copy fresh.

**This is not built and the Builder must not build it.** It is listed so the option is documented
rather than forgotten.

---

## 7. Data requirements

### 7.1 Catalog — the single source of truth

| Role | Location | Written by |
|---|---|---|
| **Authoritative** | `clients/solar-london/catalog-template.json` → becomes `clients/solar-london/catalog.json` | Raymon / Infrastructure Agent |
| **Runtime copy** | the literal `const CATALOG = {...}` inside the `Load Catalog` **Code** node | Builder, pasted from the repo file |
| **Drift detector** | `EXPECTED_CHECKSUM` — a bare string literal pasted *separately* in the same node | Builder, computed at S1 |

**Why in-workflow and not a database:** decision 6 said a deterministic in-workflow catalog; a small
constant in a Code node needs zero new DDL; and the only three credentials on the instance are
`OpenAI account`, `Postgres account` and `Supabase account f1`. The cost is drift between the repo
file and the node constant, so the checksum is **mandatory** and a mismatch is a hard stop at S1 and
at every catalog change thereafter.

#### 7.1.1 How the checksum is actually computed — do not improvise this

This is the step most likely to be got wrong, and the failure is silent, so it is specified exactly.

**The digest covers the canonical JSON of the catalog payload with `catalog_checksum` itself set to
the empty string, and with every documentation key removed** — that is, every key beginning with
`_`, and every key ending in `_note`. Canonical means: object keys sorted, no insignificant
whitespace, UTF-8.

Two exclusions, two reasons, both load-bearing:

- **Excluding `catalog_checksum` is not an optimisation — it is the only way the value can exist at
  all.** A digest computed over a document that *contains* that digest cannot be written back into
  the document, because writing it changes what gets hashed. Every attempt ends in a value that
  fails its own verification. `Load Catalog` performs exactly the same normalisation before hashing,
  so the two sides agree by construction rather than by luck.
- **Excluding the `_`/`_note` keys** means editing an explanation in this spec's own templates cannot
  break a live quote. A prose fix should never take the sales flow down.

**And the check compares two independently pasted values, because a self-referential check can only
ever pass.** If `Load Catalog` recomputed a digest and compared it to a value carried *inside the
object it just hashed*, the two would agree no matter how stale the paste was — it would detect
nothing, while looking rigorous. So the node holds the expected value **twice, in two places that
must be pasted separately**:

```js
// Paste 1 — the bare expected digest, from catalog.json's catalog_checksum field.
const EXPECTED_CHECKSUM = '<64 hex chars>';

// Paste 2 — the full catalog payload, from the same file. Note: EXPECTED_CHECKSUM is NOT
// part of this object, which is what keeps the two pastes independent.
const CATALOG = { … };

// Verification. Same normalisation on both sides.
const bare = { ...CATALOG, catalog_checksum: '' };
const payload = Object.fromEntries(
  Object.entries(bare)
    .filter(([k]) => !k.startsWith('_') && !k.endsWith('_note'))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
);
const canonical = JSON.stringify(payload);
const actual = createHash('sha256').update(canonical, 'utf8').digest('hex');

if (actual !== EXPECTED_CHECKSUM) {
  return [{ json: {
    ok: false, needs_human: true, status: 'catalog_checksum_mismatch',
    failure_reason: `catalog drift: node holds ${actual}, catalog.json declares ${EXPECTED_CHECKSUM}. ` +
                    `The prices in this node are NOT the prices in catalog.json. Re-paste both.`,
  }}];
}
```

That is the drift that actually happens — a Builder edits `catalog.json`, re-pastes the object, and
forgets the string — and it is caught. **Node does not read the repo file at runtime**; it has no
filesystem access. On mismatch the run aborts: no price, no email, no partial quote, **no fallback to
any other source**, because a drifted in-node catalog means the prices about to be quoted are not the
prices Raymon approved.

**Update procedure, every time anything in the catalog changes:**

1. Edit `clients/solar-london/catalog.json` only. Stop if you find yourself editing both copies — the
   second copy is generated by step 2, and a hand-edit is a drift you have not detected yet.
2. Clear `catalog_checksum` to `""`, strip the `_`/`_note` keys, canonicalise, SHA-256 it, and write
   the digest back into `catalog_checksum`. The `check_quote_content.py` helper has a
   `--print-catalog-checksum` mode that does exactly this; use it rather than re-deriving the recipe.
3. Paste **both** the new payload and the new `EXPECTED_CHECKSUM` into the `Load Catalog` Code node.
   Two pastes. Both.
4. Re-run S1's verification, which includes proving the guard fires: run the node once with
   `EXPECTED_CHECKSUM` deliberately altered and confirm `catalog_checksum_mismatch` comes back. An
   unproven guard is an unverified build.

#### Catalog row schema

| Field | Type | Rule |
|---|---|---|
| `key` | string, stable `snake_case` | The only thing the agent may pass. Never shown to the lead. |
| `display_name` | string | Customer-facing name. Printed only when `customer_facing` is `true`. |
| `category` | enum | `installation` \| `storage` \| `bundle` \| `maintenance` \| `removal` \| `finance` |
| `install_type` | enum | `home` \| `commercial` \| `both` — matched against the tool input. |
| `pricing_model` | enum | `flat` \| `per_unit` \| `per_watt` \| `"TBD"`. **Raymon chooses, per service.** |
| `unit_label` | string | The per-install / per-panel / per-watt wording. From Raymon, never inferred from `pricing_model`. |
| `unit_size` | string | Only meaningful for `per_watt`. Panel wattage in **watts**. `"TBD"` until supplied. |
| `unit_size_unit` | enum | `W` \| `kW` \| `"TBD"`. **Only `W` is supported in v1** — see §5.5. |
| `unit_price` | **string** | The price. String on purpose — see below. |
| `currency` | string | `GBP` (§2). |
| `vat_included` | enum | `yes` \| `no` \| `"TBD"` |
| `includes` | string[] | Bullet deliverables. `["TBD"]` until supplied. |
| `excludes` | string[] | Bullet exclusions. `["TBD"]` until supplied. |
| `turnaround` | string | `"TBD"` until supplied. Never inferred. |
| `lead_time_note` | string | Optional extra line. `"TBD"` if needed. |
| `active` | bool | `false` rows are never matched. §4.5. |
| `customer_facing` | bool | `false` rows are never printed on a document. §4.5. |
| `requires_quote_id` | bool | `true` means the row may only appear on a formal numbered quote. |

**Why money is a string:** a numeric field cannot hold `"TBD"` without a type lie, and a type lie is
precisely how a default price sneaks in. Every money field is a string and the pricing code enforces
`/^\d{1,9}(\.\d{1,2})?$/`, parsed to integer minor units. Anything else, including `"TBD"`, is
UNRESOLVED and aborts the quote.

**`unit_size` deliberately does *not* use the money regex.** It is an integer count of watts
validated by `/^[1-9][0-9]{1,4}$/`, and `unit_size_unit` must be `W`. A catalog value written for a
kilowatt-scale system therefore **fails validation and aborts** rather than silently pricing a
kilowatt array as a handful of watts. It is also a catalog value: the model never supplies or
influences it.

### 7.2 Policy numbers live in the catalog, not in the prose

Every number that carries policy force is owned by exactly one place, `catalog-template.json` under
`policy`, so the spec text and the catalog can never disagree. The Builder reads them from the
catalog constant.

| Policy key | Shipped value | Meaning |
|---|---|---|
| `quantity.min` | `1` | structural floor; a count of zero is meaningless |
| `quantity.max` | `"TBD"` | while TBD, the effective cap equals the floor, so only a single unit is quotable and anything larger is refused (§5.4) |
| `idempotency.max_attempts` | `3` | engineering bound on retries, not a business fact |
| `idempotency.stale_claim_minutes` | a stated interval, labelled engineering | how long a `pending` claim may sit before it is reclaimable |
| `chat_quote_line_cap` | `"TBD"` | while TBD, **no cap is applied** |

`idempotency.max_attempts` and `idempotency.stale_claim_minutes` are engineering safety bounds, not
business facts, and are labelled as such in the catalog so nobody mistakes them for Raymon's numbers.
`chat_quote_line_cap` and `quantity.max` are business inputs and stay `"TBD"` until he sets them.

### 7.3 Quote records — Supabase, new table, Raymon runs the DDL

**The quote table lives in Supabase, not in the Postgres database that holds
`Launchops_chat_memory`.** Three reasons, all load-bearing:

1. **It removes the parameter-binding problem entirely.** v1.0 specified SQL with a positional
   `$1` placeholder. n8n's Postgres node's Query Parameters do not implement that form, so the SQL
   as written could not run, and the fallback on offer was raw string interpolation — an injection
   path. Supabase is reached over **PostgREST**, which takes JSON. **No SQL text with a variable in
   it exists anywhere in this build.**
2. **The quote data belongs with the dashboard events.** Both are per-lead, timestamped records for
   the same client. One store, one retention story, one place to look.
3. **One DDL, one place.** Raymon runs it in the Supabase SQL editor, which he must use for any table
   regardless.

`Launchops_chat_memory` is **mixed-case** and is used by `Postgres Chat Memory` in the text agent. It
is **not touched, not renamed, and not joined to.** The `Postgres account` credential is used for
nothing in this build.

**The DDL lives in exactly one place: `clients/solar-london/build-spec/solar_london_quotes.sql`.** It
is not restated here, deliberately — two copies of a DDL drift, and a drifted DDL is how a build ends
up claiming a column that does not exist. Raymon runs that file in the Supabase SQL editor, then runs
the verification `SELECT` at the bottom of it and pastes the result into the build report.

**`status` values.** `pending` | `emailed` | `blocked_tbd` | `failed_email` | `failed_document` |
`contract_violation` | `bad_input` | `no_matching_service` | `catalog_checksum_mismatch` |
`internal_error`. `pending` is the write-ahead in-flight state and is what makes a double-send
impossible (§8). There is deliberately **no** `max_attempts_reached` status: a row that has exhausted
its attempts keeps the status of the attempt that exhausted it, and the cap is a property of the
`attempt` column, not a new outcome. `bad_input` and `no_matching_service` are written only if the row
was already claimed; a `bad_input` before the claim writes no row at all.

**`attempt` is a real column**, `not null`, defaulting to `1` and incremented by the reclaim path in
§8. v1.0 used `attempt` in the idempotency key while the DDL had no such column, so the retry cap had
nothing to count and could not work. It is now a column, it is written, and the cap counts it.


**Access pattern, and the injection rule.** Every read and write is a PostgREST call through the
`Supabase account f1` credential, via the `n8n-nodes-base.supabase` node (Resource: Table) or, if
those operations are unavailable on this instance, via `n8n-nodes-base.httpRequest` against
`https://<supabase-ref>.supabase.co/rest/v1/solar_london_quotes` with the same credential in the
`apikey` and `Authorization` headers. **Both carry JSON. Neither carries SQL.**

> **The injection rule, stated once:** free text — `contact_name`, `email`, `company_name`,
> `quote_rows_text`, `total_display`, `summary_text`, `price_ledger`, `services` — travels **only in
> a request body**. The only values that appear in a URL filter are `idempotency_key` and
> `contact_id`, and each is regex-validated in a Code node **immediately before** the request:
> `/^[0-9a-f]{64}$/` for the digest and `/^[A-Za-z0-9_-]{1,64}$/` for the contact id. If either
> assertion fails the run aborts with `bad_input`. A character set restricted to hex digits, or to
> alphanumerics plus underscore and hyphen, cannot express a filter, a quote, a semicolon or a
> comment marker, so the filter path is injection-free by construction rather than by escaping.

**The Service Supabase → Quotes relationship.** The Builder needs a **service-role** key for the
`Prefer` header and for the claim's atomicity guarantee; an anon key cannot. §16 Q30.

### 7.4 Dashboard events — every outcome, not just success

v1.0 emitted nothing for a blocked or failed quote, so a lost quote was invisible. Fixed: **one
event per run, on every path.** The single node `Dashboard - Quote Outcome` is the target of all
**ten** `Return:` nodes, so it cannot be forgotten on a branch.

| Run status | `event_type` |
|---|---|
| `emailed` | `quote_generated` |
| `blocked_tbd`, `catalog_checksum_mismatch`, `bad_input`, `no_matching_service`, `failed_email`, `failed_document`, `contract_violation`, `internal_error` | `quote_blocked` |

Envelope — canonical and non-negotiable, per AGENTS.md §7:

```json
{
  "event_type": "<quote_generated | quote_blocked>",
  "client_id": "<GHL contact_id>",
  "timestamp": "<ISO-8601 UTC>",
  "payload": {
    "lead_name": "<the contact_name input>",
    "services": ["<catalog key>"],
    "currency": "GBP",
    "status": "<run status>",
    "failure_reason": "<null on success>",
    "emailed": true
  }
}
```

`quote_generated` and `quote_blocked` are **additive** to the four canonical event types in
AGENTS.md §7.1 and replace none of them. Conversion rate is still
`booking_made ÷ conversations`. `payload.meta.sample` is **never** set — this is real data only
(§7.2 of AGENTS.md).

**Stage-gated.** The node is built **only once Raymon supplies a live dashboard deployment URL**
(§16 Q28). If there is no URL, the node is not created, the graph terminates at each `Return:` Set
node, and stage S8 is recorded as **skipped with the reason** — not silently omitted. The pipeline
is only considered complete when the outcome event is emitted, or when the stage is recorded skipped.

---

## 8. Idempotency — one atomic claim, no double-send

Two hazards, both real: the tool is called twice in one turn, and the lead re-asks later the same day.

### 8.1 The key

```
idempotency_key = sha256_hex(
    [ contact_id,
      matched keys sorted and joined by '+',
      UTC day as YYYY-MM-DD ].join('|')
)
```

**`attempt` is deliberately NOT in the key.** It was in v1.0, and that was wrong in a way that only
appears once the claim moves before pricing. `attempt` is the row's *retry counter*, and the retry
counter is a property of a row that already exists — but the key is what decides whether the row
exists, because it is the unique index the claim insert collides on. Putting `attempt` in the key
makes it circular: the workflow would have to know the attempt number before it can look up the row
that holds the attempt number. A Builder "solving" that circularity by starting `attempt` at 0 and
incrementing it per run silently disables the duplicate protection, because every run then inserts a
*new* row with a *new* key and the same lead gets one email per call.

The key is the **identity of the quote request** — who, what, which day. The `attempt` column is the
**history of attempts at that identity**. Two different jobs, two different fields:

- Same turn, same services, same day → **same digest** → the second insert collides → one email.
- Next day → different digest → a legitimately fresh quote is allowed.
- Changed service set → different digest.
- Same day, after a `blocked_tbd` → same digest, so the row is **reclaimed** with `attempt + 1` rather
  than duplicated. One row, one history, one place to look.

The digest is computed in a Code node, and `/^[0-9a-f]{64}$/` is asserted before it is used in any
request (§7.3). `matched keys` are the **catalog keys**, sorted — never free text, so the lead's
wording cannot change the key. The key is computed from the **requested** keys (split and trimmed
from `requested_services`), not from the *matched* ones, because it has to exist before matching runs.

### 8.2 The claim

**`Claim Quote` is the single gate, and it is the first thing after input validation.** One PostgREST
insert with `Prefer: resolution=ignore-duplicates,return=representation`, into
`solar_london_quotes`, with `status: 'pending'` and `attempt: 1`.

| Result | Meaning | Action |
|---|---|---|
| one row returned | this run owns the attempt | proceed to `Load Catalog` |
| zero rows returned | the unique index on `idempotency_key` already holds a row — **another run owns it** | `Load Stored Outcome` → `IF Reclaimable?` → reclaim or `Return: Duplicate — Not Resent`. **Never send.** |

**This is what makes a double-send impossible.** v1.0 had a read-then-write pair with no in-flight
state: two calls in the same turn could both read "not found" and both insert, and the same lead
could be emailed twice. A single atomic insert against a unique index cannot interleave. There is no
window between "check" and "insert", because there is no separate check.

**The claim is written before any pricing and before any outbound email, and it is written with
`status: 'pending'`, not `'emailed'`.** A crash between the claim and the send leaves a `pending` row,
which is a visible, queryable record — not a silent gap, and not a claim that pretends an email went
out.

### 8.3 The reclaim path — so `pending` cannot become a permanent hole

A `pending` row left by a crash, or a row that ended in a recoverable state, is reclaimable under a
bound. **The staleness test applies to `pending` only** — a `blocked_tbd` row is *finished*, not
in-flight, and gating its reclaim on a clock would mean a lead who re-asks the same day after a TBD
block silently gets nothing.

```
IF Reclaimable?  (evaluated on the row returned by Load Stored Outcome)

  attempt < policy.idempotency.max_attempts            -> false -> Duplicate (max_attempts_reached)
  status in ('blocked_tbd','failed_document','failed_email')   -> true, no clock test
  status = 'pending'
      and updated_at < now() - interval '<stale_claim_minutes> minutes'  -> true
  status = 'pending' and fresh                          -> false -> Duplicate (claim_in_flight)
  status in ('emailed','catalog_checksum_mismatch','contract_violation')
                                                        -> false -> Duplicate (not_reclaimable)

Reclaim Quote:
  update solar_london_quotes
     set attempt = attempt + 1,
         status  = 'pending',
         updated_at = now()
   where id = '<the id from Load Stored Outcome>'
     and status = '<the status observed>'                -- the observed guard makes this race-free
     and attempt < <policy.idempotency.max_attempts>
   returning attempt
```

- One row returned → this run owns the attempt, `attempt` has been incremented, and the run continues
  forward down the same linear graph.
- Zero rows returned → the status or `attempt` changed between the read and the update, so a
  concurrent run won. → `Return: Duplicate — Not Resent`, `failure_reason: 'claim_lost_race'`.
  **Never send.**

`blocked_tbd` is reclaimable, which is exactly what makes §4.4 work: while the catalog has `"TBD"`
prices, a re-ask re-runs the pricing, aborts again, and says so again — and the day Raymon fills the
numbers in, the very next re-ask claims `attempt 2`, quotes and emails, with no code change.

`emailed`, `catalog_checksum_mismatch` and `contract_violation` are **not** reclaimable. A checksum
mismatch is an operator problem that needs a human, and a contract violation must never be retried
into a send.

### 8.4 The decision table

| Stored row | Action |
|---|---|
| none | insert `attempt = 1`, claim, proceed |
| `emailed` | `Return: Duplicate — Not Resent`. Return the **stored** `quote_id`, `quote_rows_text` and `total_display`, `duplicate: true`, `emailed: true`. **No document, no email.** |
| `blocked_tbd` / `failed_document` / `failed_email`, `attempt < max` | reclaim per §8.3 and retry |
| any of the above, `attempt >= max` | `Return: Duplicate — Not Resent`, `failure_reason: 'max_attempts_reached'`. **Human required. Never send.** |
| `pending` and fresh | `Return: Duplicate — Not Resent`, `duplicate: true`, `emailed: false`, `failure_reason: 'claim_in_flight'` |
| `pending` and stale | reclaim per §8.3 |
| `catalog_checksum_mismatch` / `contract_violation` | `Return: Duplicate — Not Resent`, `failure_reason: 'not_reclaimable'`. **No send, human required.** |

**The duplicate branch returns the stored row's numbers.** It never re-runs pricing, so a re-ask
reads as a helpful repeat and can never come back with a different figure for the same request.


### 8.5 What the lead experiences

- Called once → the price in chat, one email.
- Called twice by accident → one email, one price, `duplicate: true` internally.
- Re-asked an hour later → the **same** numbers again, no second email.
- Re-asked tomorrow → a fresh `quote_id`, one email, the same or updated prices.
- Re-asked while the catalog is `"TBD"` → the handoff line, and **no email, ever**.

---

## 9. Wiring the tool into the text agent, and the prompt block

### 9.1 The one new node

| Field | Value |
|---|---|
| Node name | `solar_london_quote` |
| Node type | `@n8n/n8n-nodes-langchain.toolWorkflow` |
| Workflow from | **"LaunchOps Quoting Workflow"** (the rebuilt sub-workflow) |
| Connect `ai_tool` output → | **`AI Conversation Agent`**, alongside the existing `Supabase Vector Store` |
| Credential | **none needed** — the node is a pointer |

**Name:** `solar_london_quote`

**Description (paste verbatim — this is what drives trigger reliability):**

> Get an official written price quote for Solar London services. Use this ONLY when the customer
> asks for a price, a cost, an estimate, a quote, a price list, a package, or what a number of panels
> would cost. This tool writes the official quote, emails it to the customer, and returns the exact
> prices and the total. Call it once per request. You must never state a price that is not in this
> tool's result.

**Tool inputs** are the nine fields in §5.3, with these instructions in the node:

| Tool input | Instruction text |
|---|---|
| `contact_id` | The GoHighLevel contact id for this conversation. **Set this field's default to the expression `={{ $('Set Contact ID').item.json['Contact ID'] }}`.** |
| `contact_name` | The customer's name exactly as it should appear on the quote. |
| `email` | The customer's email address, exactly as it is on their GHL contact record. **Never ask the customer for it and never type it from the conversation.** |
| `company_name` | Their company name. Leave blank for a home install. |
| `install_type` | Either `home` or `commercial`, based on what the customer told you. |
| `requested_services` | Comma-separated service keys from the service list. Never free text, never a sentence, never a description. |
| `quantity` | The number of units the customer said, as **digits only**. No unit word, no decimal point, no written number. Leave blank if they did not say a number. |
| `conversation_notes` | One short factual line: what they want priced. |
| `currency` | Always `GBP`. |

**Identity fields are expressions, not model output.** `contact_id` and `email` are set as field
defaults referencing the real GHL data, so they cannot be the model transcribing a chat transcript.

> **Test this at S6, do not assume it.** n8n does not evaluate expressions in every context, and
> Workflow Tool input defaults are one such context. Execute one real conversation and read the row
> that lands in `solar_london_quotes`: `contact_id` and `email` must be the **real GHL values**,
> never the literal string `{{ ... }}` and never a value the agent typed. If the expressions do not
> resolve, the fallback is for the sub-workflow to read the parent's `Webhook` node directly inside a
> Code node — and that too must be tested end to end, not assumed. **If neither mechanism resolves,
> stop and report back to the Leader.** Do not ship a build in which an LLM transcribes an email
> address from a chat transcript. That is precisely the hallucination this whole spec exists to
> prevent, and under the Gmail node (§6.6) the address is the delivery target.

### 9.2 The handoff line — verbatim, and nothing added to it

Amy's live `AI Conversation Agent` systemMessage contains this sentence, verbatim from the export:

```
IMPORTANT: If the requested information from the customer is not found you MUST check the Vector
Datastore. If it is still not found you MUST tell the user something like: "let me check that with
my manager".
```

The **verbatim substring** is:

```
let me check that with my manager
```

> `lead_line` in every one of the ten terminals is exactly that substring. **Nothing is appended
> to it.** v1.0 used `let me check that with my manager and come back to you`, which added a clause
> outside the quote while claiming to be quoted from it — an unverifiable attribution. If a longer
> sentence is ever wanted, it goes in a **separate** field `lead_line_continuation`, which is never
> presented as coming from the persona.

It is a literal in the workflow, not model output, so it matches Amy's voice by construction and
cannot be hallucinated. One message for every failure mode is intentional: the lead must not learn
that a price database is incomplete.

### 9.3 The `systemMessage` block to append

**Append to the end of `AI Conversation Agent → Options → System Message`. Do not rewrite, reorder,
or remove any existing line.** The persona, the qualification questions, the booking-link rules and
the human-voice rules are working and are not this project's business. The existing block is 4,462
characters; this adds the block below and changes nothing that is already there.

```
# Quotes and Pricing

- If the customer asks how much something costs, or asks for an estimate, a quote, a price, a price
list, a package, or a price for a number of panels, you MUST call the solar_london_quote tool once
and then use its result. You must never answer a pricing question from memory.

- Only ONE tool call per turn. If you already called it this turn, use the result you already have.

- Fill the tool inputs only from what the customer actually told you, plus the service keys from the
service list. The service keys must be keys, never a sentence or a description. For quantity, use
digits only. If you are not sure which key applies, call the tool with the closest one and let it
tell you, rather than guessing at a number yourself.

- GROUNDING RULE. You may only state a number that appears in the tool result. Every price, total and
figure you tell the customer must be copied exactly from the tool result. If the number is not in the
tool result, you do not know it, and you do not say it.

- DO NOT INVENT DATA. Never guess, estimate, round, infer, or recall a price, discount, VAT rate,
install time, panel size, battery capacity, or payment plan. Not from an earlier conversation, not
for another customer, not from anything you think you remember about solar panels. Ever. A made up
price is far worse than no price.

- If the tool result has ok false, or needs_human true, do NOT mention any price at all, and do not
say why it failed. Do not say the system is incomplete, unavailable, or still being set up. Just tell
the customer in your own normal voice that you are checking it with your manager, and keep the
conversation warm. Do not apologise more than once. Do not mention tools, systems, catalogs,
automations, or a quote system.

- If the tool result has ok true, relay the quote rows from the tool result exactly as they are
written, then mention that you have sent the full quote over email and offer the booking link. Do not
restate a figure a different way, do not convert it, do not round it, and do not offer a discount,
payment plan, or installation date that is not in the tool result.

- The tool emails the quote to the customer. Do not ask for their email address, do not ask them to
confirm one, and do not promise to resend the quote inside the chat.

# Output rules for quotes. These override anything above.

- Plain text only. No markdown, no bullet characters, no bold, no tables, no HTML, no headings.
- Put each price in its own message so it is not split or merged with other text.
- If you have already given the prices in this conversation, do not repeat the whole quote unless the
customer asks for it again.
```

**Why this shape**, per the `prompt-engineer` skill
(`.opencode/.agents/skills/prompt-engineer`): role and task unchanged; the trigger condition is a
concrete list of phrases; an explicit grounding rule; an explicit don't-invent clause **with its
reason** ("a made up price is far worse than no price"), which raises compliance; a branch for every
tool outcome so the model never improvises; and the format section last, because format rules hold
better in recency-weighted positions. The deliberate departure from her existing prompt is the
`GROUNDING RULE` heading, written as a hard rule to match the weight of her existing `IMPORTANT`
rules rather than as a soft suggestion.

**Plain ASCII only. No long dash character anywhere in this block** — her existing rules forbid it
in output and putting one in a prompt is a needless formatting hazard.

### 9.4 The pre-agent classifier must not steal price questions

`Classify (Human/AI)` sits before `AI Conversation Agent` and has exactly one category, `Human`,
fallback `other`, with a prompt that ends *"Do not match if the user is just asking a technical or
informational question without requesting human interaction."* A price request therefore routes to
the **AI** branch today, which is what we want.

**Do not add a category to that classifier.** If anyone adds a "Pricing" category routed to `Human`,
the lead is handed off before the quote tool can ever run. S6's acceptance test includes a price
question reaching the agent rather than being handed off.

---

## 10. Error handling — fail loud, never silent (AGENTS.md §9.7)

### 10.1 What the live workflow did wrong, and the fix

| Live behaviour | Why it was dangerous | Fix |
|---|---|---|
| `HubSpot Trigger` wired as a second entry point with no credential | **The live workflow cannot run at all.** Activating it fires a branch that errors immediately | Node deleted. One trigger remains: `Webhook` |
| `Get a contact` dangling, uncredentialed, no parameters, in no connection | Dead node that could never run, and the only GHL-API path | Node deleted. No GHL API call in the build |
| 3-input `Merge` behind the quote chain | If any one branch failed, the merge **never fired**, so the follow-up task was silently never created | **No `Merge` node anywhere.** Ten terminals, one shared telemetry target |
| Pricing built inside `AI Agent` — *"Build pricing internally"* | An LLM was the pricing engine. One hallucinated digit and the customer gets a wrong number | Every number computed in a Code node from the catalog. The LLM writes one sentence and is filtered |
| `Find Services` reading a Google Sheet named for a different business | Wrong-business catalog; no Sheets credential | Replaced by the in-workflow `Load Catalog` constant with a checksum |
| `Email the Quote` with no credential, `recipient@example.com`, `[YOUR_AGENCY_NAME]`, and marketing-agency copy | A customer's quote addressed to a placeholder, branded as another company | Node deleted. Replaced by `Send Quote Email` with a hard recipient gate (§6.6) |
| `HTML Payload` with `Monthly Price` / `One-Time Price` and a `new Date().toLocaleDateString()` | Retainer-agency shape, and a locale-dependent date that differs between dev and production | Deleted. v1 builds its own document with an explicit date format |
| `Create Follow-up task` with `dueDate: 2025-12-07T13:56:37` | Follow-up tasks created overdue on arrival | Node deleted |
| No error output anywhere | A failing branch produced nothing in the UI, so a stall read as "nothing happened" | Every fallible node is `Continue (error output)` and every failure lands in a `Return:` terminal with a populated `failure_reason` |
| A blocked or failed quote emitted no event at all | **A lost quote was invisible** | One `quote_blocked` event on every non-success terminal (§7.4) |

### 10.2 Backstop: the n8n Error Workflow

Set an **Error Workflow** on the n8n instance (Settings → Error Trigger) that notifies Raymon. This
catches what the sub-workflow deliberately absorbs: a Supabase outage at the wrong moment, a Code
node syntax error, an n8n restart mid-quote. `Return: Internal Error` is that workflow's terminal
destination. The sub-workflow's `failure_reason` values keep the **customer-facing** path calm; the
Error Workflow keeps the **operator** informed. Both are required: a system that is calm to the
customer and silent to the operator is the defect this section exists to remove.

### 10.3 Never do these

- Never fall back to placeholder, sample, or illustrative data on an error path.
- Never swallow a failure with no `failure_reason` recorded in Supabase.
- Never return `ok: true` with `emailed: false`. `Contract Check` aborts that.
- Never return a number that did not come from the pricing code.
- Never coerce, repair, or default a malformed `quantity`.
- Never price from a catalog whose checksum does not match.
- Never let the self-test row or any `customer_facing: false` row onto a document.
- Never interpolate free text into a URL filter or into any statement text.

---

## 11. The GHL chat send path is reused, unchanged

```
AI Conversation Agent  →  Segment Response  →  HTTP Request1  →  services.leadconnectorhq.com/hooks/…
```

- `HTTP Request1`'s URL, its body parameters (`Contact ID`, `Message1..Message5`, `Conversation
  History`) and the `Segment Response` split rules are **not modified** by this project.
- The quote sub-workflow sends **no** chat message. It returns `quote_rows_text`, and the agent's
  own reply path carries it.
- `Conversation History` continues to be populated from `$('Chat Memory Manager')`, so the quote turn
  is in the history GHL receives.

### 11.1 Known residual risk, stated honestly

`Segment Response` is an LLM that rewrites and splits the agent's message. A price could in
principle be reformatted. Mitigations in place: the prompt block requires each price to be its own
message; `Guard Summary` removes every unverified digit before the agent sees it; `Contract Check`
re-asserts the digit allow-list immediately before the tool result is returned.

**Residual risk is not zero** and is not eliminable while the splitter is an LLM.

- **S7 acceptance test:** read the actual delivered WhatsApp message and confirm it contains the
  **exact figure** from the catalog. A required QA step, not optional.
- **v2 option if QA ever catches a corrupted figure:** emit the price block through a deterministic
  passthrough — a Code node that appends the priced lines to the segmented messages *after*
  `Segment Response`, unmodifiable by the model — instead of through the LLM splitter. Not built in
  v1. Recorded so it is not a surprise later.

---

## 12. Verification

### 12.1 What `scripts/verify_document.py` can and cannot guard

**Can:** for a **PDF** it extracts, it checks that every string in `must_appear` is present and that
every string in `must_not_contain` is absent, in whitespace-normalised text.

**Cannot:**

| Limit | Consequence here |
|---|---|
| **It is PDF-only.** It reads bytes with `pypdf`. | The v1 quote output is an **HTML email**. Handed an `.html` file the script cannot open it. So the guard does not apply to the delivered artifact unless the HTML is first rendered to a PDF. |
| **It only reads two keys.** `must_appear` and `must_not_contain`. | Every other key in `facts.json` — pricing, business, persona, email — is invisible to it. |
| **It does substring matching, not word matching.** | `CRO` matches inside any word containing those three letters. `null` matches inside `nullable`. Over-broad entries cause false failures. |
| **It does not know the catalog.** | It cannot tell whether a figure on a quote came from the catalog. A *wrong* number passes it as long as it is not on the blocklist. |
| **It does not know the business.** | **QA proved this: a PDF rebuilt from the old marketing copy PASSES the guard.** |
| No-argument invocation prints usage and exits **2**. | The invocation documented in v1.0 could never pass. |
| PowerShell does not expand a wildcard for a native exe. | `.../*.pdf` is passed through literally, the script reports "file not found", and it exits **1 on a correct file**. |

**The guard is necessary and NOT sufficient.** It catches leftover placeholders and a small blocklist
of known-bad strings. It does **not** catch wrong-business content, and it does not catch a wrong
number. §12.3 is the check that does.

### 12.2 The working procedure

**Step 1 — produce a PDF the guard can read.** v1 has no in-workflow PDF. So the PDF is produced
**repo-side, from the same content the workflow produces**, using the `pdf` skill at
`.opencode/.agents/skills/pdf`. The `Build Quote Document` Code node emits the quote HTML **and** its
plain-text rendering as two fields on the tool result and as two columns in the Supabase row, so the
Builder can render the identical text to a PDF outside n8n for checking. The n8n instance has no
access to this repo and no Python in its container, so the skill **cannot** be called from inside a
workflow — do not spec it as if it can.

**Step 2 — run the guard with a resolved path.** From the **repo root**, in PowerShell:

```powershell
python scripts/verify_document.py clients/solar-london/facts.json (Resolve-Path 'clients/solar-london/build-spec/render/quote-sample.pdf').Path
if ($LASTEXITCODE -ne 0) { throw 'fact check FAILED - stage blocked' }
```

For several files, resolve them with the shell first:

```powershell
Get-ChildItem 'clients/solar-london/build-spec/render' -Filter *.pdf |
  ForEach-Object { python scripts/verify_document.py clients/solar-london/facts.json $_.FullName }
if ($LASTEXITCODE -ne 0) { throw 'fact check FAILED - stage blocked' }
```

**Rules that make this work, each one earned from a real failure:**

- **Never pass a literal glob.** `clients/solar-london/pdfs/*.pdf` is passed through unexpanded by
  PowerShell to a native executable and the script exits 1 on a correct file. Resolve first.
- **Never invoke with fewer than two arguments.** With none, the script prints its docstring and
  exits 2 without checking anything. Exit 2 is not a pass.
- **Run from the repo root.** The paths above are relative to it.
- **Check `$LASTEXITCODE` explicitly.** A printed `ALL PASS` without an exit-code check is not a
  gate.
- **`render/` is a scratch directory.** It is not a document store — see §12.4.

**Step 3 — the fact sheet's limits, stated plainly.** What `must_appear` and `must_not_contain` guard:
a leftover `[YOUR_*]` placeholder, a leftover `YOUR_GOOGLE_SHEET_*`, a `TBD` reaching a document, a
zero or an empty figure, an unresolved `{{ }}` expression, a bare `null` or `undefined`, the old
marketing vocabulary, and the name of the other business that was in the catalog. What it **cannot**
guard: a plausible-looking but wrong business, a service name nobody thought to blocklist, a price
that is not in the catalog, an email in the wrong place, or a figure that is internally inconsistent.
`must_appear` currently holds one confirmed string. It stays that way until Raymon confirms more —
padding it teaches the team that the guard means something when it does not.

### 12.3 The check that actually catches wrong-business content

`check_quote_content.py`, at `clients/solar-london/build-spec/check_quote_content.py`. It is
**derived from the catalog and the workflow export**, not from a hand-written list, so it catches
content nobody thought to blocklist.

```powershell
python clients/solar-london/build-spec/check_quote_content.py `
  --catalog  clients/solar-london/catalog.json `
  --facts    clients/solar-london/facts.json `
  --quote    clients/solar-london/build-spec/render/quote-sample.txt `
  --ledger   clients/solar-london/build-spec/render/price-ledger.json `
  --export   clients/solar-london/build-spec/text-agent-LIVE.json `
  --expect-nodes 44
if ($LASTEXITCODE -ne 0) { throw 'content check FAILED - stage blocked' }
```

It runs six checks and prints one line per check, plus a readiness warning:

| # | Check | What it catches |
|---|---|---|
| **A** | **Catalog subset.** Every service name printed on the document must be the `display_name` of a row with `customer_facing: true`, **and** must appear in the price ledger. | **Any foreign service, from any business, including ones no blocklist anticipated.** A positive structural rule, not a blocklist — and it runs in both directions, so a service printed on the document but missing from the ledger is caught as an unbound line rather than passing unnoticed. |
| **A1** | **Business readiness.** Warns, does not fail, when no row is `customer_facing: true`. | The honest consequence of §4.5: no Solar London service can be legitimately quoted until Raymon answers Q10–Q13, so a real price request correctly aborts. Loud, but not a build failure — confirming a service is Raymon's to answer, and asserting one here would be inventing scope. What still hard-fails: a ledger line naming a non-customer-facing row, and a catalog with no `active` row at all. |
| **B** | **Price binding.** Every money token in the document must be a ledger figure, and **every ledger figure is recomputed from the catalog's own `unit_price` and `pricing_model`** — `flat`, `per_unit` or `per_watt` with integer watts. | **A hallucinated, remembered, rounded or invented number reaching a customer.** The recomputation is what makes this a pricing guard: a ledger of line totals alone would prove the arithmetic, not the inputs. Also asserts the TBD invariant: while any price is unresolved, the ledger must hold **no lines** and the document must print **no money at all**. |
| **C** | **Token scan.** No `[YOUR_`, no `YOUR_GOOGLE_SHEET_`, no `TBD`, no `recipient@example.com`, no `=US`, no bare `null` / `undefined` / `NaN`, no unresolved `{{` or `}}`, no `llama`, and none of the retired marketing strings. | Every placeholder class that has actually occurred in this project, including the ones still sitting in the live export. Token list is de-duplicated across `facts.must_not_contain` and `catalog.forbidden_business_content`, so one defect is reported once. |
| **D** | **Self-test isolation.** The reserved-namespace row must have `customer_facing: false`, must not be printed, and at least one row must be `active: true`. | The §4.5 probe leaking into a real quote, or a catalog whose machinery can never run. |
| **E** | **Export grep.** No `hubspot`, `stripe`, `googleSheets`, `ollama`, `highLevel`, `htmlcsstopdf`, `n8n-nodes-base.merge`, `presentationscheduled`, `llama3.1`; no **assigned** secret; node count equals `--expect-nodes`. | The whole regression class of this pass: a foreign node type, a Merge node, a stray credential, or a paste that was never removed. |
| **F** | **Prompt binding.** `solar_london_quote` exists, is a `toolWorkflow` node with a `workflowId`, and is wired to the `AI Conversation Agent` `ai_tool` input; the systemMessage contains `# Quotes and Pricing`, `GROUNDING RULE` and `DO NOT INVENT DATA`; and the persona's handoff literal is present in the prompt. | A build where the tool exists but the grounding rules do not, or where the tool was added but never connected — the two states where the agent "remembers" a price instead of reading the tool result. |

**Exit codes.** `0` all passed · `1` at least one check failed · `2` invoked wrongly (missing file, bad
JSON, missing argument) — and **exit 2 is not a pass**, exactly like `verify_document.py`.

**The checker was verified against the current unbuilt state, and against three deliberate
violations**, so it is known to fail rather than assumed to:

| Input | Expected | Result |
|---|---|---|
| the abort-state sample (no money, empty ledger) against the **live 64-node** export | A, B, C, D pass; **E and F fail** — the 19 pasted quote nodes are still there and the tool is not added yet | as expected |
| a document printing `GBP 123.45` with an empty ledger | **B fails** twice: the figure is not in the ledger, and money printed while prices are unresolved | as expected |
| a document naming the self-test row | **A and D fail**: non-customer-facing row printed, and printed outside the ledger | as expected |
| the old marketing copy (`JR Marketing Agency`, `Transparent Pricing`, …) | **C fails** on all three strings, each reported once | as expected |

A guard that has never been observed to fail is not a guard. The negative-test figures above are
deliberately arbitrary and appear nowhere else in this spec, so a synthetic test number can never be
mistaken for a real one — and the one price-like figure Raymon has actually said, the ambiguous
"about 6k pounds" in §4, is quoted **nowhere** except on that single provenance line. Quote this table
in the build report and re-run the same four inputs at S4; if any of them starts passing, the checker
has regressed.

Check A alone is what QA proved missing. Check B is what makes this a *pricing* guard rather than a
*text* guard. Both are required; neither replaces the fact sheet.

**A related and important caveat.** The `Gmail` sender address, the reply-to and the sign-off are
delivery metadata, not document text, so neither check reads them. They are guarded separately: every
value printed on a document or in an email comes from `catalog.document_defaults`, and
`Build Quote Document` reads only that object. Any `"TBD"` in `document_defaults` that is needed for
the output aborts the run with `blocked_tbd` and sends nothing — the same fail-loud rule as a price
(§6.5 shows this for the sender address).

### 12.4 Notion rules that apply to this flow

AGENTS.md §7.3 applies. Non-negotiable, learned the hard way:

- **Client documents live in Notion. There is no `clients/solar-london/documents/` folder, and this
  build does not create one.**
- The `render/` directory above is a **verification scratch target, not a document store.** Its
  contents are transient, are not client documents, and are not committed.
- Anything that is to be filed as a client document is uploaded to the Notion **Client Documents**
  database with `scripts/notion-upload-document.mjs`, and surfaced in the portal's Documents tab.
- **Never create Notion databases with API version `2025-09-03`** — it silently drops the schema and
  yields `Name`-only databases. Creation and upload use **`2022-06-28`**.
- Under `2025-09-03`, queries hit `/v1/data_sources/{id}/query`; under `2022-06-28` they hit
  `/v1/databases/{id}/query`. `docs/notion-store.json` records `dataSources` so the portal handles
  both.
- Databases cannot be deleted via the API. A broken or duplicate database is removed by Raymon in
  the Notion UI.
- A **quote** is a sales document, not one of the four `Client Documents` types (proposal, contract,
  invoice, receipt). Whether Solar London quotes get their own Notion database, or become a column on
  the client project, is Raymon's call (§16 Q31). Until he answers, the quote is a GHL email
  artifact and a Supabase row, and the Builder files nothing.

---

## 13. Builder Agent prompt — grounding and anti-hallucination rules

**Copy this block into the Builder Agent's task prompt verbatim.** Written per the `prompt-engineer`
skill and required by AGENTS.md §5.

```
## Grounding rules for this build

You are implementing the Solar London quote integration from
clients/solar-london/build-spec/quote-integration-spec.md and
clients/solar-london/build-spec/text-agent-node-inventory.md. Those two files are the contract. The
spec is version 2.0 and it supersedes any earlier instruction you may have about this project. If a
detail is not in them, you do not decide it yourself.

READ FIRST, IN THIS ORDER:
1. clients/solar-london/build-spec/text-agent-node-inventory.md  - the 64-node keep/delete list.
   Apply it exactly. 21 deletions, 1 addition.
2. clients/solar-london/build-spec/quote-integration-spec.md    - the build.
3. clients/solar-london/build-spec/text-agent-LIVE.json         - the evidence, read-only.
4. clients/solar-london/build-spec/quote-workflow-LIVE.json     - the evidence, read-only.
Do not derive anything from any older export in Downloads/.

1. DO NOT INVENT DATA. The only price information that exists is the literal string "TBD" in
   clients/solar-london/catalog-template.json. You must never write a real or example price,
   discount, VAT rate, install time, panel wattage, battery capacity, finance rate or payment term
   anywhere: not in the catalog, not in a Code node default, not in a test fixture, not in a sample
   payload, not in a comment, not in a prompt, not in the build report. If a test needs a price, the
   only legitimate test value is the literal string "TBD" and it must be testing the abort path.

2. The single price statement Raymon has made in conversation is: "it depends on what the person pick
   it a solar panel let say it about 6k pounds". It is ambiguous, it is recorded as provenance of an
   open question, and you must never parse it into a price, use it as a default, or use it to check a
   future value.

3. "TBD" IS THE SHIPPING STATE, NOT A BLOCKER. The system is complete and safe with every price at
   "TBD". Building and verifying the abort path is the deliverable. Do not stub, defer, or skip a
   stage because a price is unresolved, and do not treat it as a reason to leave a node unwired.

4. Every money field in the catalog is a STRING. Prices are parsed with /^\d{1,9}(\.\d{1,2})?$/ and
   computed in integer minor units. Anything that fails that parse is UNRESOLVED and must abort the
   quote. Do not introduce floats for money and do not introduce a fallback price. unit_size is NOT a
   money field: it is an integer count of watts matching /^[1-9][0-9]{1,4}$/ with unit_size_unit "W".

5. Every number the agent can see must originate in the pricing code node. The LLM writes one
   sentence of prose. Guard Summary removes any digit from that prose which is not in the priced
   fields, and Contract Check re-asserts the digit allow-list immediately before the tool result is
   returned. Do not weaken either, and do not add a second place where a total is computed.

6. Do not create a Merge node. Do not create a node whose type or credential is not in the approved
   list. The only credentials that may be used are: OpenAI account, Postgres account, Supabase
   account f1, and the new Solar London Gmail credential that Raymon creates. Never reference
   hubspot, stripe, googleSheets, ollama, highLevel, or htmlcsstopdf in any node you build.

7. Do not write a credential, API key, token, password or refresh token into any file, node
   parameter, prompt, export or report. Reference credentials by NAME only. The Gmail credential is
   created by Raymon in the n8n UI from values he reads out of the gitignored .env; you never see
   those values and you never write them down. Secrets live in .env and nowhere else.

8. If a fact, a price, a URL, a field path, or a decision is missing, STOP and report it in the build
   report as an open item. A blocked stage reported honestly is a success. An invented value shipped
   into a client dashboard or a customer email is a critical failure. In particular body.email is
   UNVERIFIED - capture one real form fill at S3 and record the real field path rather than assuming
   it.

9. Fail loud. Every fallible node continues to an explicit error branch, and every failure records a
   failure_reason. Never silently substitute data, never return a zero, never return a partial
   result, never return ok:true with emailed:false.

10. If a spec item is ambiguous, implement the literal reading and list the ambiguity in the build
    report. Do not silently pick the interpretation you find most likely.

11. Verify with the two checks, not one. Run scripts/verify_document.py on a PDF rendered
    repo-side, with a path resolved by the shell and $LASTEXITCODE checked - it is necessary but NOT
    sufficient, and it passes the old wrong-business copy. Then run
    clients/solar-london/build-spec/check_quote_content.py, which is the check that actually catches
    wrong-business content and binds every printed number back to the catalog. Both must pass.

12. Do not touch the live n8n instance while preparing the build. Work from the exports. Report the
    exact node-level changes you would make and let the Leader apply them to the instance.
```

> **Note on item 12.** The Builder prepares and verifies the graph from the exports and reports the
> diff. **Raymon applies the node inventory to the live instance.** This is a deliberate constraint
> on this pass: the inventory is written to be applied by a human in the canvas, and an agent
> editing a production workflow unattended is a risk the Infrastructure Agent does not take.

---

## 14. Roadmap

Each stage names its dependency and **what proves it is done**. No stage depends on a later stage.

| Stage | Work | Depends on | Done when |
|---|---|---|---|
| **S0** | Raymon creates the `Solar London Gmail` credential (§6.3) and runs the `solar_london_quotes` DDL (§7.3) in Supabase. He supplies the sender address (§16 Q29). | — | Credential shows Connected in n8n; `solar_london_quotes` exists with an `attempt` column and a unique index on `idempotency_key`; Raymon confirms both in writing |
| **S1** | Copy the templates to `clients/solar-london/catalog.json` and `facts.json`. Compute `catalog_checksum` with the helper and paste it into the field **and** record it for the node's `EXPECTED_CHECKSUM`. **Leave every price at `"TBD"`.** Render one sample quote repo-side and run both checks. | S0 | `catalog_checksum` written into `catalog.json` and re-printed identically by the helper (idempotent — running it twice on the updated file returns the same digest, which is the proof the self-reference is broken); `check_quote_content.py` prints `ALL PASS`; the fact-sheet guard exits 0 on the rendered PDF |
| **S2** | **Apply the node inventory.** Export the live text agent, dated, as the rollback point. Delete the 21 nodes. Verify 43 remain and `Webhook` is the only trigger. | — | Node count 43 confirmed on the canvas; no missing-credential markers; the dated export is on disk |
| **S3** | **Node and field availability audit, read-only.** (a) `htmlcsstopdf` presence, all four methods in the inventory §5. (b) `base.supabase` Table operations, or the PostgREST fallback. (c) `executeWorkflowTrigger` input mode. (d) `toolWorkflow`. (e) **Capture one real GHL form fill and record the exact field path for the lead's email address.** (f) Confirm the `Solar London Gmail` credential is selectable on a Gmail node. | S0, S2 | Each of the six recorded in the build report with the method used; the email field path recorded **from a real payload** |
| **S4** | Build the quote sub-workflow per §5.2, with every price at `"TBD"`. Deterministic pricing, the abort guard, the wattage guard, the quantity guard, **32 nodes / 10 terminals** (33 once node 18 is unblocked by Q28), all eight `Mark…` row-closing nodes, no Merge, no loop, no LLM number. | S1, S2, S3 |
 A manual run with the catalog at `"TBD"` returns `ok:false, needs_human:true, status:'blocked_tbd'`, the verbatim `lead_line`, **no number in the object**, and **no email sent** — and the row is `blocked_tbd`, not stranded in `pending`. A grep of the export shows **no** `hubspot`, `stripe`, `googleSheets`, `ollama`, `highLevel`, `htmlcsstopdf`, `merge` |
| **S5** | The duplicate and reclaim paths (§8); the Gmail send (§6.5); `Guard Summary` and `Contract Check` (§5.6); the n8n Error Workflow. | S4 | Two identical calls in one turn produce **one** row and **one** email. A re-ask the same day while the catalog is still `"TBD"` reclaims `attempt 2`, aborts again, and **still sends no email**. A crash-simulated stale `pending` reclaims on the next call. Every failure path returns a populated `failure_reason` and leaves **no row in `pending`**. `Contract Check` aborts a deliberately corrupted object |
| **S6** | Add `solar_london_quote` to the text agent (§9.1) and append the §9.3 systemMessage block to `AI Conversation Agent`. Verify 44 nodes. | S2, S5 | The node inventory §6 checklist is complete. The saved row shows the **real GHL** `contact_id` and `email`, never a literal `{{ }}` and never a model-typed value |
| **S7** | Acceptance and idempotency matrix, all with prices at `"TBD"` so the abort is exercised: a real price question reaching the agent; the abort firing; the handoff line in the delivered WhatsApp message; no email; twice in one turn; re-ask same day; re-ask next day; unknown service key; the self-test row requested; a malformed `quantity`; a `quantity` above the TBD cap; a missing `email`; a corrupted checksum. | S6 | Exactly one claim and one email per intended quote. `duplicate: true` on repeats. **No number ever reaches the lead in any abort case.** The lead still gets a chat reply in every case |
| **S8** | *(Optional.)* `Dashboard - Quote Outcome`, **only once Raymon supplies a live dashboard URL** (§16 Q28). | S7 + the URL | A green response and the event visible in Supabase with the real `client_id`; **or** the stage recorded as **skipped with the reason**, and the graph terminating at each `Return:` node |
| **S9** | Activate. Post-activation verification. Final dated exports as the rollback point. Build report. | S7 (S8 if in scope) | `active = true` with no credential error. Ten real-lead test conversations with no silent stall. Final exports saved and linked from the report |

**Ordering is strictly S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9.** S1 may run in parallel
with S2. **Nothing is gated on Raymon's prices.** S0 is the only gate, and it is three concrete
actions, not twenty-eight questions.

**Rollback at any point before S9:** the workflow is `active = false`, so rollback is to deactivate
it and re-import the dated export taken at S2 (and the S9 export after that). No other system
depends on this build.

---

## 15. The regression grep

Run against the **new** text-agent export at S2 step 13 and again at S6. Every token below must
return **zero** matches. The list is derived from what is actually in the live export today.

| Token | Where it is now |
|---|---|
| `hubspot` | `HubSpot Trigger`, `Update deal`, `Get the deal`, `Get Company`, `Get Contact`, `Create Follow-up task` |
| `stripe` | `Create Customer` |
| `googleSheets` | `Find Services` |
| `ollama` | `Ollama Chat Model` |
| `highLevel` | `Get a contact` |
| `htmlcsstopdf` | `HTML to PDF` |
| `n8n-nodes-base.merge` | `Merge` |
| `presentationscheduled` | the `If` node's condition |
| `llama3.1` | the `Ollama Chat Model` node |
| `2025-12-07` | the `Create Follow-up task` hardcoded due date |
| `YOUR_AGENCY_NAME`, `YOUR_NAME`, `YOUR_EMAIL`, `YOUR_PHONE`, `YOUR_LOCATION` | `HTML Payload`, `Email the Quote` |
| `YOUR_GOOGLE_SHEET_ID`, `YOUR_GOOGLE_SHEET_URL` | `Find Services` |
| `JR Marketing` | `Find Services` cached name |
| `recipient@example.com` | `Email the Quote` |
| `marketing services quote`, `growth-focused marketing partner`, `paid traffic systems`, `Dial in your funnels`, `Turn cold traffic`, `Transparent Pricing`, `monthly and one-time`, `Scale Your Brand`, `Custom Strategy` | `Email the Quote`, `HTML Payload` |
| `Monthly Price`, `One-Time Price` | `HTML Payload` table headers |
| `=US` | `Build Customer` |
| any env var name followed by an equals sign and a value, e.g. ``GMAIL_CLIENT_SECRET` `=` `<value>``; likewise `SUPABASE_SERVICE_ROLE_KEY` `=`, `N8N_API_KEY` `=`, `NOTION_TOKEN` `=`, and the JSON shape `"GMAIL_…": "…"` | **an assigned value** — a match means a secret reached a file. (The names are written here split around the `=` on purpose: a bare `NAME=` in this spec would itself trip every secret scanner it is describing.) |

> **On that last row, read it precisely, because an earlier draft of this table got it wrong.** The
> env var **names** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` etc. are *required*
> to appear in this spec and in `facts-template.json` — Raymon has to know which three names to read out
> of `.env`. A bare name is documentation, not a secret. What must never appear is an **assignment**:
> a name, then `=`, then a value. Grep for the assignment shapes, not for the names.


```powershell
$e = 'clients/solar-london/build-spec/text-agent-LIVE.json'
$dead = @('hubspot','stripe','googleSheets','ollama','highLevel','htmlcsstopdf',
          'n8n-nodes-base.merge','presentationscheduled','llama3.1','2025-12-07',
          'YOUR_AGENCY_NAME','YOUR_GOOGLE_SHEET_ID','JR Marketing','recipient@example.com',
          'marketing services quote','growth-focused marketing','paid traffic systems',
          'Dial in your funnels','Turn cold traffic','Transparent Pricing',
          'monthly and one-time','Scale Your Brand','Custom Strategy',
          'Monthly Price','One-Time Price')
foreach ($t in $dead) {
  $n = (Select-String -LiteralPath $e -Pattern $t -SimpleMatch -AllMatches |
        ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
  if ($n) { "FAIL  $t = $n" } else { "ok    $t = 0" }
}

# Secrets: match ASSIGNMENTS, not names. A bare env var NAME is documentation.
# These are regexes, so they need -Pattern without -SimpleMatch.
$secretPatterns = @(
  'GMAIL_CLIENT_SECRET\s*=\s*\S',
  'GMAIL_REFRESH_TOKEN\s*=\s*\S',
  'GMAIL_ACCESS_TOKEN\s*=\s*\S',
  'SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'']?\S',
  'N8N_API_KEY\s*[:=]\s*["'']?\S',
  'NOTION_TOKEN\s*[:=]\s*["'']?\S',
  '"GMAIL_(CLIENT_SECRET|REFRESH_TOKEN|ACCESS_TOKEN)"\s*:\s*"[^"]+'
)
foreach ($p in $secretPatterns) {
  $n = (Select-String -LiteralPath $e -Pattern $p -AllMatches |
        ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
  if ($n) { "FAIL  <secret assignment> = $n   [$p]" } else { "ok    <secret assignment> = 0" }
}
```

Any `FAIL` line fails the stage. Quote the whole output in the build report. The two greps are
separate on purpose: the first is a fixed-word `-SimpleMatch` sweep, the second needs regex for the
`name = value` shape.

---

## 16. Open questions

Two are hard build-blocking. One is stage-gated with a documented skip. **No pricing question is
blocking** — §4.4 makes `"TBD"` shippable.

> **On the numbering.** `Q28`, `Q29` and `Q30` below are the three **stage-gate** questions and are
> numbered separately from the **24 catalog, pricing and business questions numbered 1–24** in
> §16.2–§16.6. They are not question 28, 29 and 30 of that list — that list stops at 24. An earlier
> draft of this section claimed "three are build-blocking" while simultaneously giving Q28 a working
> default, which is how a Builder ends up treating a documented skip as a blocker or vice versa.

### 16.1 Hard build-blocking — no default exists

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| **Q29** | **Which Gmail account sends Solar London's quotes, and is it on Solar London's own domain?** A quote arriving from a personal mailbox is a brand defect, and the account must be one Raymon controls long-term. | S0 | **Hard stop.** Not defaulted — the credential is not usable until this is answered. |
| **Q30** | **Does the `Supabase account f1` credential on the n8n instance hold a service-role key, or an anon key?** The atomic claim in §8.2 needs a service-role key for the `Prefer` header; an anon key cannot guarantee it. | S0 | **Hard stop** for the claim path. The Builder reports and the duplicate protection stays documented-but-unbuilt until it is answered. |

### 16.1b Stage-gated, **not** blocking — a documented default exists

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| **Q28** | **Is there a live dashboard deployment for Solar London?** If yes, its URL, so S8 can run. | S8 only | **No.** S8 is **recorded as skipped**, the event node is not created, and the graph terminates at each `Return:` node. This is a complete, working state, not a gap. |

### 16.2 The 6k sentence — needed before the system can ever quote

Raymon gave one ambiguous sentence. To turn it into a real catalog:

1. **Is the ~6k per panel, per install, or per project?** The single question that matters most.
2. Is that figure **VAT-inclusive** or **plus VAT**? If plus VAT, what is the VAT rate?
3. Is it a **real list price** or an illustration for a conversation? If real, does it have a minimum?
4. Does the price **vary with panel count**? If so, is there a base price plus a per-panel price?
5. What **panel wattage** do you install? (Only needed if pricing is per watt. v1 supports watts only; a kilowatt-scale catalog entry will fail validation and abort rather than misprice.)
6. Is a quote a **fixed price** or an **estimate** subject to a site survey? This changes the document wording, not just a catalog line.
7. How long is a quote **valid**? This must be printed on the document.
8. Are **scaffolding, surveys or crane hire** charged separately, included, or excluded?
9. Is **finance** offered, and if so by which provider? A finance figure or an APR is a number you must give us; we will not infer one.

### 16.3 The catalog

10. **Is this the right set of services?** These are *proposed keys only* — rename, add or delete
    freely: `home_solar_install` · `home_battery_storage` · `home_solar_with_battery` ·
    `commercial_solar_install` · `solar_maintenance` · `solar_repair` · `electric_ev_charger` ·
    `solar_removal` · `finance_options`.
11. For each one you keep: `pricing_model` — `flat`, `per_unit`, or `per_watt`? And set
    `active: true` / `customer_facing: true` on the ones that are real.
12. Which apply to **home** only, **commercial** only, or **both**?
13. What goes in `includes` and `excludes` for each?

### 16.4 Business facts — all currently `"TBD"` and all **print-blocking**

Each of these is a `document_defaults` value, and **each aborts the quote with `blocked_tbd` until it
is filled** (§12.3). None is guessed.

14. The exact **registered or trading company name** for the document header and the email signature.
15. The **sender email address** — see Q29.
16. The **phone number** to print.
17. The **postal address** to print.
18. Should the document carry a **review or Trustpilot line**? The persona cites a specific volume of
    five-star reviews. Confirm it is current **before** it goes on a client-facing quote.
19. **VAT registration number**, if one should appear.
20. Any **terms line**, for example that prices are subject to a site survey. If the quote is an
    estimate rather than a fixed price, this line is not optional.

### 16.5 Policy values

21. `quantity.max` — the largest number of identical units quotable in one request. While `"TBD"`,
    only a single unit is quotable and anything larger is refused (§5.4).
22. `chat_quote_line_cap` — whether Amy summarises long quotes in chat, and after how many lines.
    While `"TBD"`, no cap is applied.

### 16.6 Not blocking — a documented default applies

23. **Should the Intro lane also be able to quote?** Default **no**. It keeps this change to one
    agent and one tool.
24. **Should `AI Conversation Agent`'s classifier get a pricing category?** Default **no** — adding
    one hands the lead off before the tool can run (§9.4).
25. **Should every generated quote be filed in the Notion Client Documents database automatically?**
    Default **no** — do not file. Notion is the document store of record (AGENTS.md §7.3), but a client
    PDF belongs there only once Raymon wants it, and uploading on every run would put quotes in Notion
    that nobody has approved.     If he says yes, use `scripts/notion-upload-document.mjs` with Notion API version **2022-06-28** —
    never `2025-09-03`, which silently drops the schema and yields `Name`-only databases.


---

## 17. Appendices

### 17.1 v1.1 — the PDF tail. **Documented, NOT BUILT.**

Recorded so the option is a known decision rather than a surprise later. **The Builder does not
build this, and does not leave half-wired nodes for it.** §5.2 is the complete v1 graph.

Insert this between `Contract Check` and `Send Quote Email`, and email the rendered file instead of
the HTML body:

| Node | Type | Purpose |
|---|---|---|
| `Render PDF` | `n8n-nodes-htmlcsstopdf.htmlcsstopdf` | **Community package. Availability unverified — inventory §5.** Input is the quote HTML. On error → `IF PDF OK?` |
| `Fetch PDF` | `base.httpRequest`, `responseFormat: file` | Downloads the rendered PDF into binary property `data` |
| `IF PDF OK?` | `base.if` | false → `Mark Failed (PDF)` → `Return: Failed — PDF`, `status:'failed_pdf'`, **no email** |
| `Store PDF` | `base.supabase`, Resource Storage / Operation Upload | Requires a **service-role** key and a bucket Raymon creates. **Use a time-limited signed URL. Never a public bucket** — a public bucket puts every client's quote PDF on the open internet |
| `Mark Emailed` | amended | Also sets `pdf_object_path` |

`Send Quote Email` then adds Options → Attachments → `Attachments Input Type: Binary Field`,
`Binary Property: data`, and the subject gains the same quote reference. `email.pdf_attachment_route`
in `facts.json` moves from `B1` to `B2`.

**Gates:** `htmlcsstopdf` confirmed present; a Supabase bucket exists; the credential is
service-role; a signed-URL policy is written. Until all four hold, v1 ships HTML.

### 17.2 v2 — a Postgres-backed catalog

If Raymon wants to change prices without opening n8n, move `CATALOG` to a `solar_london_catalog`
table, have `Load Catalog` read it, and keep `catalog_checksum` as a content hash rather than a
literal so drift stays detectable. Not built in v1.

### 17.3 Failure signatures

| Signature | Cause | Fix |
|---|---|---|
| Workflow will not activate; a credential error appears on load | A node references a credential that does not exist | Inventory §6 step 7. The three approved credentials are `OpenAI account`, `Postgres account`, `Supabase account f1`, plus `Solar London Gmail` |
| The workflow errors the moment it is activated | A second trigger with no credential. `HubSpot Trigger` caused exactly this | Inventory §6 step 3 |
| Saved row contains the literal text `{{ ... }}` | A body field is not resolving its expression | Use expression defaults on the tool inputs (§9.1); test at S6 |
| Agent never calls the quote tool | The classifier stole the price question, or the tool description is too vague | §9.3, §9.4 |
| Agent states a number not in the tool result | The grounding block is missing, or a digit survived a filter | §9.3; re-check `Guard Summary` and `Contract Check` |
| Two emails for one conversation | The claim was reordered after the send, or `Prefer` was dropped from the claim request | §8.2 |
| `400` from PostgREST on a quote write | A `Prefer` header or a service-role key is missing | §16 Q30 |
| Every quote returns `blocked_tbd` after prices were filled | `catalog_checksum` was not recomputed, or the node constant was not re-pasted | §7.1 update procedure |
| A `per_watt` service always aborts | `unit_size` is not an integer watt value, or `unit_size_unit` is not `W` | §5.5. This is the intended fail-loud behaviour, not a bug |
| `check_quote_content.py` check A fails | A service name is on the document that is not a `customer_facing` catalog row | Wrong-business content. Do not add it to the blocklist — fix the source |
| `verify_document.py` exits 2 | It was invoked with fewer than two arguments | §12.2 |
| `verify_document.py` reports "file not found" on a file that exists | A literal glob was passed and PowerShell did not expand it | §12.2. Resolve the path first |
