# Build Report — Solar London Quote Integration

**Client slug:** `solar-london`
**Spec version:** 2.0
**Builder:** Builder Agent
**Date:** 2026-09-26

---

## 1. Artifacts Produced

| File | Path | Status |
|---|---|---|
| Cleaned text agent | `clients/solar-london/text-agent-SOLAR-LONDON.json` | **BUILT** |
| Quote sub-workflow | `clients/solar-london/quote-workflow-SOLAR-LONDON.json` | **BUILT** |
| Catalog | `clients/solar-london/catalog.json` | **BUILT** |
| Facts | `clients/solar-london/facts.json` | **BUILT** |
| DDL SQL | `clients/solar-london/build-spec/solar_london_quotes.sql` | **EXISTS** (pre-existing) |

---

## 2. Text Agent Clean-up — Node Counts

| Metric | Value |
|---|---|
| Live nodes before | **64** |
| KEEP (unchanged) | 42 |
| KEEP + MODIFY (`AI Conversation Agent`) | 1 |
| DELETE | **21** |
| Nodes after clean-up | **43** |
| ADD (`solar_london_quote` toolWorkflow) | 1 |
| **Final node count** | **44** |

### 21 Deleted Nodes
All 21 nodes from spec §3.2 confirmed deleted. The `highLevel` token appears once in the text-agent export only as `"GoHighLevel"` (platform name in the tool description of `solar_london_quote`), NOT as a node type. This is a false positive for the `-SimpleMatch` case-sensitive grep.

### AI Conversation Agent Modifications
- Appended §9.3 `systemMessage` block (`"# Quotes and Pricing"` … `"Output rules for quotes"`)
- Existing systemMessage was 4,462 chars; now 7,133 chars
- No other parameter changed

### solar_london_quote Node
- Type: `@n8n/n8n-nodes-langchain.toolWorkflow`
- Connected via `ai_tool` output to `AI Conversation Agent` (alongside existing `Supabase Vector Store`)
- Input schema has all 9 fields per spec §5.3 with expressions for `contact_id` and `currency`

---

## 3. Quote Sub-Workflow — Node Counts

| Metric | Value |
|---|---|
| Total nodes | **33** (23 functional + 10 terminals; 32 while node 18 deferred) |
| Mark nodes (row closers) | **8** |
| Return nodes (terminals) | **10** |
| Merge nodes | **0** |
| Loop nodes | **0** |
| LLM price source | **0** (only `Quote Summary AI` uses gpt-4.1 for prose) |
| Forbidden node types | **0** (no hubspot, stripe, googleSheets, ollama, highLevel, htmlcsstopdf, merge, llama3.1) |

### Node Breakdown
| Type | Count |
|---|---|
| `executeWorkflowTrigger` | 1 |
| `code` (Validate Input, Load Catalog, Match+Price, Guard Summary, Build Doc, Contract Check) | 6 |
| `set` (Return:* terminals) | 10 |
| `supabase` (Claim, Load, Reclaim, Mark*) | 11 |
| `if` (IF Reclaimable?, IF Email OK?) | 2 |
| `chainLlm` (Quote Summary AI) | 1 |
| `gmail` (Send Quote Email) | 1 |
| `httpRequest` (Dashboard) | 1 |

### All 33 Node Names
```
When Executed by Another Workflow
Validate Input
Return: Bad Input
Claim Quote
Load Stored Outcome
IF Reclaimable?
Reclaim Quote
Return: Duplicate — Not Resent
Load Catalog
Mark Catalog Drift
Return: Catalog Drift
Match + Price Quote
Mark No Matching Service
Return: No Matching Service
Mark Blocked (TBD)
Return: Blocked — Price TBD
Quote Summary AI
Guard Summary
Build Quote Document
Mark Failed (Document)
Return: Bad Document
Contract Check
Mark Contract Violation
Return: Contract Violation
Send Quote Email
IF Email OK?
Mark Failed (Email)
Return: Failed — Email
Mark Emailed
Return: Priced + Emailed
Mark Internal Error
Return: Internal Error
Dashboard - Quote Outcome (STAGE-GATED)
```

---

## 4. Catalog Checksum

```
catalog_checksum: 742d5d2bb790ab4090f348ffc7f2772e93898eaac4163adc8b3aecb35896755f
```

Computed per spec §7.1.1: canonical JSON with `catalog_checksum` set to `""`, all `_`/`_note` keys filtered, keys sorted, compact JSON, SHA-256. Round-trip verified. Embedded in Load Catalog code node as `EXPECTED_CHECKSUM`.

---

## 5. Verification Results

### Regression Grep (text-agent-SOLAR-LONDON.json)
All forbidden tokens return **0** matches (case-sensitive `-SimpleMatch` as specified). The only `highLevel` occurrence is `"GoHighLevel"` in the tool description — a platform name, not the `highLevel` node type. **PASS.**

### Node Count Verification
- Text agent: 44 nodes ✓
- Quote workflow: 33 nodes ✓
- 8 Mark nodes present ✓
- 10 Return nodes present ✓
- No Merge node ✓
- solar_london_quote is toolWorkflow ✓
- Connected to AI Conversation Agent ai_tool ✓
- systemMessage contains `# Quotes and Pricing`, `GROUNDING RULE`, `DO NOT INVENT DATA`, handoff literal ✓

---

## 6. BLOCKERS

### Blocker 1: n8n API Authentication (401 Unauthorized)
**Severity:** HIGH — prevents applying workflows to the instance and running end-to-end tests.

**What happened:** All attempts to access `http://localhost:5678/rest/workflows` and `http://localhost:5678/rest/credentials` return HTTP 401 Unauthorized. The `N8N_API_KEY` from `.env` does not authenticate against this instance. The n8n settings endpoint (`/rest/settings`) reveals `authenticationMethod: "email"`, meaning this n8n instance uses email/password auth, not API key auth. The `N8N_API_KEY` may be for a different n8n instance or a different auth mechanism.

**Impact:** Cannot apply the cleaned text-agent workflow or quote sub-workflow to the live n8n instance via API. Cannot create the Gmail credential via API. Cannot run end-to-end POST tests to the webhook URL.

**Workaround needed:** Raymon must either (a) provide the email/password credentials for this n8n instance, (b) configure the API key properly in n8n settings, or (c) apply the JSON files manually via the n8n canvas.

### Blocker 2: Supabase DNS Resolution Failed
**Severity:** HIGH — prevents applying the `solar_london_quotes` DDL.

**What happened:** `curl`/`urllib` requests to `https://ptybnbdjtwhcggqdqnjw.supabase.co` fail with `getaddrinfo failed` (DNS resolution error). The Supabase REST API is unreachable from this machine.

**Impact:** Cannot apply the DDL to create the `solar_london_quotes` table with the `attempt` column and unique index on `idempotency_key`. Cannot verify the table exists. Cannot run the Supabase claim/insert/update operations.

**Exact SQL for Raymon to run** (from `clients/solar-london/build-spec/solar_london_quotes.sql`):
```sql
create table if not exists solar_london_quotes (
  quote_id          text primary key,
  idempotency_key   text not null unique,
  contact_id        text not null,
  contact_name      text,
  email             text,
  company_name      text,
  install_type      text,
  quantity          integer,
  services          jsonb not null default '[]'::jsonb,
  currency          text not null default 'GBP',
  subtotal_minor    bigint not null default 0,
  total_minor       bigint not null default 0,
  total_display     text,
  quote_rows_text   text,
  summary_text      text,
  price_ledger      jsonb not null default '[]'::jsonb,
  status            text not null,
  attempt           integer not null default 1,
  failure_reason    text,
  catalog_checksum  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  emailed_at        timestamptz
);
-- Plus indexes and verification SELECT (see full DDL file)
```

### Blocker 3: Gmail Credential Not Created
**Severity:** MEDIUM — blocks the email sending path.

**What happened:** Cannot create the `gmail` credential via API due to n8n auth failure (Blocker 1). The `.env` contains `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_REDIRECT_URI`, and `GMAIL_ACCESS_TOKEN` but they cannot be applied to n8n programmatically.

**Required action:** Raymon must create the `Solar London Gmail` credential in the n8n UI: Credentials → New → Google OAuth2 API, using values from the gitignored `.env`.

### Blocker 4: htmlcsstopdf Community Node — NOT APPLICABLE
**Status:** NOT A BLOCKER. Per spec §6.4, v1 does not generate a PDF. The `htmlcsstopdf` node was removed from the live export (it was part of the deleted quote cluster). The spec explicitly ships a styled HTML email, no attachment. The `check_quote_content.py` and `verify_document.py` workflow renders HTML to PDF repo-side using the `pdf` skill.

---

## 7. Test Plan (Cannot Execute — Blocked)

The following tests were planned but CANNOT be executed due to Blockers 1–3:

| Test | Expected | Status |
|---|---|---|
| POST GHL payload to webhook | Conversation lane routes to AI Conversation Agent | **BLOCKED** — n8n unreachable |
| Agent calls solar_london_quote tool | Tool invokes quote sub-workflow | **BLOCKED** |
| Prices are TBD → abort, no email | `needs_human: true`, `status: 'blocked_tbd'`, `lead_line: 'let me check that with my manager'` | **BLOCKED** |
| Second identical request | Same idempotency_key → `duplicate: true`, no second email | **BLOCKED** |
| Catalog row price changed to test value | Quote produced, email path executes | **BLOCKED** |
| Mark active:false afterwards | Workflow left in safe state | **BLOCKED** |

---

## 8. Files Ready for Deployment

All JSON artifacts are structured correctly and ready to be imported into n8n once the authentication issue is resolved. The files are at:

1. `clients/solar-london/text-agent-SOLAR-LONDON.json` — 44 nodes, active=false
2. `clients/solar-london/quote-workflow-SOLAR-LONDON.json` — 33 nodes, active=false
3. `clients/solar-london/catalog.json` — With verified checksum
4. `clients/solar-london/facts.json` — TBD values (shipping state)

---

## 9. Commits Made

All artifacts committed to git. No credentials written to any file. `.env` is gitignored.

---

## 10. Next Steps

1. **Raymon resolves n8n auth** → Apply JSON files via n8n canvas or fixed API
2. **Raymon creates Gmail credential** → In n8n UI from `.env` values
3. **Raymon runs Supabase DDL** → In Supabase SQL editor
4. **Once all three are done** → Run the full test matrix in §7
