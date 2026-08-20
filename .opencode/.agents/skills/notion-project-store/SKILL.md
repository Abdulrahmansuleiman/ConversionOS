---
name: notion-project-store
description: Interact with the LaunchOps HQ Notion project store — the single source of truth for client projects, roadmap milestones, build assets, feedback, and testimonials. Use whenever the portal, a dashboard build, or the Leader needs to read/write project data in Notion, create a per-client feedback form, add a new client project + roadmap, or debug why portal data is missing. Triggers: "notion store", "project store", "add client to the portal", "create feedback form", "roadmap for a client", "portal data", "seed the database".
---
# Notion Project Store (LaunchOps HQ)

The portal's data lives in Notion, under the **LaunchOps HQ** page
(`3c263684-59d9-8051-82e7-f2c189d18111`). Six databases hold everything:

| Database | Title property | Purpose |
|---|---|---|
| `Projects` | `Client` | One row per client engagement |
| `Roadmap` | `Milestone` | Milestones per project, grouped by Phase |
| `Build Assets` | `Asset` | AI persona prompt, build spec, workflow, dashboard URL |
| `Client Feedback` | `Feedback` | Per-client form responses |
| `Testimonials` | `Quote` | Approved client quotes for the portal |
| `Client Documents` | `Name` | Client-facing PDFs (proposal, contract, invoice, receipt) + payment status |

## Client document storage (canonical, no local folders)

Every client-facing PDF (proposal, contract, invoice, receipt) is stored **in
Notion only** — never in `clients/<name>/documents/` or any repo folder, no matter
how many clients exist. Generated PDFs go to a temp dir and are deleted after
upload/email. The **Client Documents** database is the single record: document,
amount, status, paid date, payment method, and the attached file.

Use `scripts/notion-upload-document.mjs` to store a PDF:

```
node scripts/notion-upload-document.mjs \
  --file <path.pdf> --client-name "Bloomline Apparel" \
  --title "Invoice - Bloomline Apparel" --type Invoice \
  --amount 750 --date 2026-08-20 --status Sent --method Stripe \
  [--notes "..."] [--paid-date 2026-08-22]
```

- `--client-name` is matched against the `Projects` database and converted to the
  `Client` relation; `--client-id` accepts a raw page id instead.
- The script uses the Notion **file-upload flow**: `POST /v1/file_uploads`
  (`mode: single_part`) → send bytes to the returned `upload_url` with
  **method POST**, `Notion-Version: 2026-03-11`, and a multipart `FormData`
  `file` field → poll `GET /v1/file_uploads/{id}` until `uploaded` → create the
  page with the `file_upload` attached to the `File` property plus a `pdf` block.
  (The send endpoint is **POST**, not PUT — PUT returns `400 invalid_request_url`.)
- "Amount paid" is not a separate entry: it's the invoice row flipped to
  `Status = Paid` + `Paid Date` + `Payment Method`.

## Where the wiring lives

- **Store file** — `docs/notion-store.json` (source of truth) and its copy
  `launchops-portal/notion-store.json`. It maps friendly names → database ids and
  data-source ids. The portal loads the copy at runtime.
- **Portal backend** — `launchops-portal/server/notion.js` reads every endpoint
  through the store; `server/routes.js` exposes `/api/*` endpoints.
- **Init script** — `scripts/notion-init.js` creates the 6 databases idempotently
  (keyed off the store file). Always uses API version `2022-06-28` for creation.
- **Seed script** — `scripts/notion-seed.js` seeds a client from
  `clients/<client>/facts.json` (project + roadmap + assets) into Notion.
- **Fix-schema script** — `scripts/notion-fix-schema.js` patches data-source
  schemas (only needed if databases were ever created with API 2025-09-03).

## Non-negotiable Notion API rules

1. **Version matters.** With `Notion-Version: 2025-09-03`, every database is seen
   as **data-source-backed**: queries must hit `/v1/data_sources/{dataSourceId}/query`,
   and GET `/v1/databases/{id}` exposes no `properties`. With `2022-06-28`,
   databases are classic: query `/v1/databases/{id}/query` and properties are
   readable. Databases created with `2022-06-28` honor the schema; databases
   created with `2025-09-03` silently ignore the `properties` payload and come out
   with only a default `Name` title.
2. **Creation must use `2022-06-28`.** Never create databases with 2025-09-03 —
   the schema will not stick and you'll end up with an empty `Name`-only database.
3. **Relations use the data-source id under 2025-09-03** when patching data-source
   schemas (`relation.data_source_id`, not `database_id`).
4. **You cannot delete databases via the API.** Broken/duplicate databases must be
   deleted by Raymon manually in the Notion UI. This has already happened once — 11
   empty `Name`-only databases were created before the version fix; they are
   leftovers to be cleaned up, not to be reused.
5. **The store file is the source of truth for ids.** Never hardcode database ids in
   agent files; always read them from `docs/notion-store.json`.

## Adding a new client to the portal

1. Confirm `clients/<client>/facts.json` exists with real fact-sheet values.
2. Run `node scripts/notion-seed.js` — it reads the facts file and creates the
   project row, its roadmap milestones (Kickoff → Design → Build → Review → Launch →
   Post-launch support), and build assets. It is idempotent (safe to re-run).
3. Create the client's **feedback form** in Notion (below).
4. Verify in the portal: login, open the project, confirm roadmap + assets render.

## Creating a per-client feedback form (native Notion Forms)

Each client gets their own feedback form so submissions land in the
**Client Feedback** database. Use the Notion MCP tools:

1. Ask the MCP server to **create a page** in the `Client Feedback` database
   (parent = `database_id` from the store). Give it a title like
   `<Client Name> — Feedback`.
2. Pre-fill the `Project` relation with the client's project page id so the
   submission is attributed correctly.
3. Share the page with the client. Notion Forms generates a public form URL from
   the page — send that link in the kickoff/offboarding email. When the client
   submits, a new row appears in `Client Feedback`.
4. Fields clients fill: `Rating` (1-5), `What Went Well`, `What Could Improve`,
   `Would Recommend` (checkbox). The `Submitted` date is set automatically.

## Portal verification (Build QA)

Before calling a portal/dashboard build complete:

- `GET /api/health` returns `{ok:true}` (proves the Notion token works).
- `GET /api/projects` lists the client row with a non-empty `title` and all facts
  intact (`Status`, `Kickoff Date`, `Launch Date`, `KPIs`, `Notes`).
- `GET /api/projects/<id>` returns the project + milestones sorted by phase +
  assets.
- `GET /api/feedback` and `/api/testimonials` return arrays (may be empty).
- `GET /api/documents` returns the client document rows with `projectName` resolved
  and a `file` object (`{name,url}`) for the download link (may be empty).
- The frontend login gate accepts `PORTAL_PASSWORD` from `.env`.