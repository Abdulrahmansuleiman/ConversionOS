# Data Model — Supabase `[DATA_STORE]`

Every webhook event must be persisted with at minimum `event_type`, `client_id`
(or lead identifier), `timestamp`, `payload`. This is **non-negotiable**
(AGENTS.md §7) — no dashboard number may be computed live-only with no stored
record behind it.

## `events` table (core)

```sql
create table public.events (
  id          bigint generated always as identity primary key,
  event_type  text not null,              -- 'booking_made' | 'handed_off_to_human' | 'follow_up_triggered' | ...
  client_id   text not null,              -- lead/client identifier from GoHighLevel
  timestamp   timestamptz not null default now(),
  payload     jsonb not null default '{}'::jsonb
);

create index events_client_id_idx   on public.events (client_id);
create index events_event_type_idx  on public.events (event_type);
create index events_timestamp_idx   on public.events (timestamp desc);
```

## KPI queries

- **Bookings:** `select count(*) from events where event_type = 'booking_made' and timestamp >= now() - interval '1 week'`
- **Handoffs to human:** `event_type = 'handed_off_to_human'`
- **Follow-ups:** `event_type = 'follow_up_triggered'`
- **Historical filters:** last week / last month / last 2 months via `timestamp` ranges.

## Optional: `clients` table

Used when the dashboard needs a client/lead dimension beyond the webhook events
(e.g. name, company, plan).

```sql
create table public.clients (
  id          text primary key,           -- matches events.client_id
  name        text,
  company     text,
  plan        text,
  created_at  timestamptz not null default now()
);
```

## Security

- Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is used by the backend webhook
  receiver to write events. Never expose it client-side.
- Dashboard reads should use anon/RLS or a restricted role — configure RLS
  policies per table before going live.
- Secrets live in `.env` only.
