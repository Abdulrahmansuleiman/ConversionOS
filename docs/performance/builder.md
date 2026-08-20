# Performance Log — Builder Agent

> Read this file BEFORE every task and follow every STANDARD below.

## Standards (always do)

- Build only from the QA-approved spec in `clients/<client-name>/build-spec/`.
- Every webhook event persisted with `event_type`, `client_id`, `timestamp`, `payload`.
- Never fabricate fallback data; errors fail loud.
- Portal/Notion work: keep the six-DB Notion model, query classic DBs with `2022-06-28`
  (data sources with `2025-09-03`), and store client PDFs only in Notion (no local
  `clients/<name>/documents/` folders).

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
