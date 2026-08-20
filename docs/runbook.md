# Runbook — LaunchOps Onboarding Agent System

## How to start a new client onboarding

1. Open opencode in this repo. The default agent is the **Leader Agent**.
2. Give the Leader Agent the trigger:
   - a new GoHighLevel lead, **or**
   - a meeting/call transcript (paste it or drop the file in `clients/<client-name>/transcripts/`), **or**
   - "new client signed for <name>".
3. Provide whatever the Leader needs that isn't already known (client name, company, agreed scope, pricing, timeline). The Leader asks; never invent details.
4. The Leader runs the standard sequence: **Proposal → QA → Email → QA → Infrastructure → QA → Builder → QA → final breakdown**.
5. After each stage you receive a breakdown report in the AGENTS.md §8 format.
6. After each completed task the Leader runs the **Feedback Agent** — you'll be asked what was done right/wrong, and the answer is recorded to `docs/performance/`. You can also trigger this yourself anytime with `/feedback`.

## Fact sheets (how numbers never get dropped)

Each client has `clients/<client-name>/facts.json` — the single source of truth
(see `scripts/facts.example.json` for the shape). Every name, number, currency,
percentage, date, and code that appears in any output goes into `must_appear`.

- Proposal Agent creates the fact sheet in Phase 1 and builds all PDFs from it.
- Email Agent pulls every value from the fact sheet.
- **`python scripts/verify_document.py <facts.json> <output>`** is the automated
  check (PDF or `--plain` text; `--subject` for emails). Any FAIL = the stage fails.
- This catches the "$10k/mo → /mo" class of bug automatically — no output ships
  without passing it.

## Configuration

- **Config:** `opencode.json` — set `default_agent: "leader"`, skills registered at `.opencode/.agents/skills`.
- **Secrets:** `.env` (see `.env.example` for the full key list). Current keys: `GMAIL_*` (filled), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_TOKEN`, `GHL_WEBHOOK_SECRET` (fill in when you have them).

## Emails

- Sent live via the Gmail API (`GMAIL_*` keys in `.env`).
- For draft-only mode, tell the Email Agent (via the Leader) to write `.eml` files to `clients/<client-name>/emails/` instead of sending.

## Missing pieces until first real onboarding

- **Supabase project** — fill `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`; apply the schema in `docs/data-model.md`.
- **Vercel token** — fill `VERCEL_TOKEN` for dashboard deploys.
- **GoHighLevel webhook secret** — fill `GHL_WEBHOOK_SECRET`; configure the webhook → n8n → Builder backend path.
- **Dashboard reference images** — drop screenshots in `.opencode/dashboard IMG/` for the Builder to match.

## Restart required

After any change to `opencode.json`, `.opencode/agent/*`, skills, or other config-time files, **quit and restart opencode** for changes to take effect.
