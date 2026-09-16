# Performance Log — Infrastructure Agent

> Read this file BEFORE every task and follow every STANDARD below.

## Standards (always do)

- The build spec/roadmap must reference the correct client fact sheet (`clients/<client-name>/facts.json`) and the correct templates.
- Every generated prompt includes explicit grounding rules and a "don't invent data" clause.
- Roadmap stages never depend on a step that hasn't happened yet.
- For client-facing sites: stats/copy that await Raymon are designed as **explicit
  placeholders** — spec marks them "awaiting Raymon," the spec's single source of truth
  (`content/stats.ts`) holds `null` for unset values so the frontend renders "—",
  and the Builder fills them only from Raymon's words, never from a reference site.

## Entries

<!-- Feedback Agent appends entries here. -->

### 2026-09-16 — LaunchOps onboarding website spec (Infra spec → QA → Builder S1-S11, Build QA conditional PASS)

✅ **Reinforce** — the spec's placeholder design worked exactly as intended:
- Stats/copy awaiting Raymon were explicitly marked as placeholders in the spec, backed by
  a single source of truth (`content/stats.ts`) with `null` for unset values so the Builder
  rendered "—" instead of guessing.
- The Builder never borrowed competitor figures (RJ's 50+/7/3x were forbidden), and Raymon
  later supplied the real values (Average ROI → 2-3x, go-live → 2-4 weeks) which the Builder
  incorporated verbatim.

📌 **Lesson / standard** — standing pattern for client-facing sites: design placeholders
as explicit (marked "awaiting Raymon" in the spec), unset values are `null` in the single
content source and render as "—" on the frontend; the Builder fills them only from Raymon's
explicit words. This pattern confirmed — keep using it.
