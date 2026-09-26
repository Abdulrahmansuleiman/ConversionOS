-- Solar London - quote records
-- Run this in the SUPABASE SQL editor. Raymon runs it; the agent cannot (no DDL from a workflow,
-- and PostgREST cannot run DDL either - same constraint as the dashboard playbook).
--
-- WHY SUPABASE AND NOT THE POSTGRES DATABASE HOLDING Launchops_chat_memory
--   1. It removes the parameter-binding problem entirely. The earlier draft specified SQL with a
--      positional $1 placeholder, which n8n's Postgres node does not implement, and the only offered
--      fallback was raw string interpolation of a lead's email into SQL - an injection path.
--      Supabase is reached over PostgREST, which takes JSON. No SQL text with a variable in it
--      exists anywhere in this build.
--   2. A quote is a per-lead, timestamped record, exactly like a dashboard event. One store.
--   3. One DDL, one place, one set of credentials.
--
-- Launchops_chat_memory is MIXED CASE, lives in a different database, and is owned by the
-- Postgres Chat Memory node in the text agent. It is NOT touched, NOT renamed, NOT joined to.
--
-- SECURITY REVIEWER NOTE: this table holds customer names, email addresses and company names.
-- Row Level Security is left DISABLED here on purpose because the only client of this table is the
-- service-role key held by the n8n `Supabase account f1` credential, which bypasses RLS anyway and
-- is never exposed to a browser. If this table is ever read from anything client-side, ENABLE ROW
-- LEVEL SECURITY and add explicit policies before that happens. Do not expose it through PostgREST
-- with the anon key.

create table if not exists solar_london_quotes (
  quote_id          text primary key,
  idempotency_key   text not null unique,        -- 64-char lowercase sha256 hex, regex-asserted before use
  contact_id        text not null,               -- the GHL contact_id; also the dashboard client_id
  contact_name      text,
  email             text,
  company_name      text,
  install_type      text,
  quantity          integer,                    -- validated in the workflow, never trusted from the model
  services          jsonb  not null default '[]'::jsonb,
  currency          text   not null default 'GBP',
  subtotal_minor    bigint not null default 0,   -- produced by the pricing code; never left null
  total_minor       bigint not null default 0,   -- produced by the pricing code; never left null
  total_display     text,
  quote_rows_text   text,
  summary_text      text,
  price_ledger      jsonb  not null default '[]'::jsonb,  -- the content check's ground truth
  status            text   not null,
  attempt           integer not null default 1,  -- REAL COLUMN. The retry cap counts this.
  failure_reason    text,
  catalog_checksum  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  emailed_at        timestamptz
);

comment on column solar_london_quotes.idempotency_key is
  'sha256 of contact_id | sorted requested catalog keys | UTC day. The retry counter `attempt` is deliberately NOT part of this key - it is the row''s history, not the request''s identity, and including it would be circular (the workflow would have to know the attempt number before it can look up the row holding it). Asserted /^[0-9a-f]{64}$/ before it is used in any request.';

comment on column solar_london_quotes.attempt is
  'Real column, not null, default 1. Incremented only by the reclaim path, never by a fresh claim. The retry cap in catalog policy.idempotency.max_attempts counts it.';

comment on column solar_london_quotes.status is
  'pending | emailed | blocked_tbd | failed_email | failed_document | contract_violation | bad_input | no_matching_service | catalog_checksum_mismatch | internal_error. pending is the write-ahead in-flight state and is what makes a double-send impossible.';

comment on column solar_london_quotes.subtotal_minor is
  'Sum of the line totals in integer minor units (pence). Equals total_minor in v1 because there is no document-level adjustment. If Raymon later adds a discount or a VAT line, total_minor = subtotal_minor + adjustments and the Contract Check assertion changes.';

-- Lookup by lead, newest first. Drives the duplicate branch that returns the stored numbers.
create index if not exists solar_london_quotes_contact_idx
  on solar_london_quotes (contact_id, created_at desc);

-- Drives the stale-pending reclaim: WHERE status = 'pending' AND updated_at < now() - interval.
create index if not exists solar_london_quotes_status_idx
  on solar_london_quotes (status, created_at desc);

-- Drives the blocked-quote report: how often the system refused to quote and why.
create index if not exists solar_london_quotes_blocked_idx
  on solar_london_quotes (created_at desc)
  where status <> 'emailed';

-- ---------------------------------------------------------------------------
-- VERIFY AFTER RUNNING (Raymon runs this, pastes the result into the build report)
-- ---------------------------------------------------------------------------
-- expect three columns: attempt, idempotency_key, status
--
-- select attempt, idempotency_key, status from solar_london_quotes limit 0;
--
-- The unique index on idempotency_key is the load-bearing part. It is what makes the atomic claim
-- in spec section 8.2 able to return zero rows for a concurrent run, which is what makes a
-- double-send impossible. If that unique constraint is missing, STOP: the duplicate protection does
-- not exist and nothing else compensates for it.
