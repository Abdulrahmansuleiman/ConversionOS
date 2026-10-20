# Portal metrics — what each number means

The Overview dashboard has four KPIs plus a launch panel. Each one is computed
server-side in `launchops-portal/server/routes.js` → `GET /api/overview`. If a
number looks wrong, this is the definition it is being held to.

| KPI | Definition | Source |
|---|---|---|
| **Total projects** | Every client project on record. | Projects database |
| **Active projects** | Every client we are working for or supporting — **including completed ones**. A delivered client is still an active client; only a project explicitly marked `Archived`, `Cancelled`/`Canceled` drops out. | `Projects.Status` (derived from roadmap) |
| **Live dashboards** | Dashboards we have actually built and deployed: the project has a `Dashboard URL` on record, or is explicitly `Live`. | `Projects.Dashboard URL` |
| **Average rating** | Mean of all client feedback ratings (1–10). Shows `—` with "No client ratings yet" when the feedback database is empty. | Client Feedback |

### Why Active projects is not "work in progress"

Active used to exclude `Completed`, which made the KPI read **0** once every
client had been delivered — the opposite of the truth. Completed work is live,
supported, and still on the books, so it counts as active. The only way a client
stops being active is an explicit archived/cancelled status.

### Live dashboards reads 0 until a URL exists

This metric counts evidence, not intention: `Live 0 → 1 → 2 → 3` as each
dashboard is recorded. Nothing is inferred. To make a project count, put its
deployed dashboard URL on the project row in Notion (or via the portal API) —
the number updates on the next load. Never invent a URL to make the number move.

### Launch panel

- **NEXT LAUNCH** — the soonest launch date on or after today, across all projects.
- **LATEST LAUNCH** — when nothing is scheduled ahead, the panel shows the most
  recent launch instead, with the label changed, rather than an empty dash.
- **— / "No launch dates recorded yet"** — only when no project has a launch date
  at all.
