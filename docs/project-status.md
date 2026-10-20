# Project status — the one rule

**The roadmap is the truth. `Projects.Status` is never written by hand.**

A project's status is derived from its roadmap milestones every time the portal
reads or writes it (`launchops-portal/server/status.js`). This exists because the
opposite caused the same bug repeatedly: every stage marked Complete in Notion
while the portal still showed **In Discovery**, because `Projects.Status` and the
milestone statuses are two independent fields.

## The contract

1. **Every stage complete → `Completed`.** Always, for every client, whatever the
   phases are called.
2. **Launch complete → `Completed`.** Post-launch support does *not* need to be
   complete first. Shipping is the finish line.
3. A completed stage raises the status to at least what that stage proves
   (Kickoff → Contracted, Design/Build → Building, Review → QA, Launch/support →
   Completed). The status can be raised by hand but never sits below what the
   roadmap proves — "In Discovery" + every stage complete is impossible.
4. A project with nothing complete keeps what is stored (new clients stay
   In Discovery until work starts).
5. A truncated roadmap (e.g. only a Kickoff row) never implies a finished
   project: "all stages complete" only means `Completed` once the roadmap is a
   full lifecycle (≥ 5 stages) or a Launch/support stage is complete.

Advance-only: marking a project complete sticks. Reopening a stage will not drag
a delivered project backwards; change the status in Notion if that is intended.

## Where it is enforced

| Layer | File | What it does |
|---|---|---|
| Derivation | `server/status.js` | `deriveProjectStatus()` — the only status logic |
| Read paths | `server/routes.js` | `/api/projects`, `/api/projects/:id`, `/api/overview` derive + heal Notion on read |
| Write paths | `server/routes.js` | `PATCH/POST /api/milestones` re-derive the parent project immediately |
| Repair | `POST /api/status/reconcile` | Heals every project in one call, idempotent |
| Client UI | `src/lib/status.ts` | Same completion rule, so the UI never disagrees |
| Tests | `scripts/test-project-status.mjs` | 33 assertions; exits non-zero on regression |

## Operating rules

- **Never PATCH `Projects.Status` on a project that has milestones.** It will be
  re-derived on the next read. Mark the stage instead.
- After importing clients or bulk-editing Notion, run:
  `node scripts/reconcile-project-status.mjs`
  (`--dry-run` to preview). Exit code 1 means drift survived — investigate.
- Run `node scripts/test-project-status.mjs` before deploying any change to
  status/roadmap logic.
- **A fix is not shipped until it is deployed.** Production deploys from the
  `master` branch of `ConversionOS`. Code sitting uncommitted locally has zero
  effect on what Raymon sees in the portal.
