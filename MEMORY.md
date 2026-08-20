# Memory — LaunchOps Onboarding Agent System

Durable, cross-cutting rules every sub-agent must read **before starting any task**
alongside its own log in `docs/performance/<agent>.md`. These rules outrank
convenience — when in doubt, follow the template, not the design instinct.

## Standards (always do)

- **Follow the template structure exactly — never create something outside it.**
  Proposal, contract, invoice, and receipt must be built strictly from the canonical
  templates in `templates/` (and `.opencode/.agents/skills/`). Do not redesign,
  restructure, or freelance the layout.

- **Invoice and receipt templates especially:** the structure, sections, fields, and
  layout come from the given template and nothing else. Do not invent new sections,
  rearrange existing ones, or add content outside the template's structure. If a
  template is genuinely missing something a client needs, **stop and flag the Leader
  Agent** — never improvise.

- Templates are canonical (AGENTS.md §9.5). No agent substitutes its own design for
  the provided template structure, no matter how "better" it looks. Design freedom is
  for new builds, not for template-based client documents.

- **Font: Montserrat, everywhere.** All client documents (proposal, contract, invoice,
  receipt) use Montserrat from `fonts/Montserrat/` (register `Montserrat`,
  `Montserrat-Bold`, `Montserrat-Italic`, `Montserrat-BoldItalic`, `Montserrat-Medium`,
  `Montserrat-SemiBold`, `Montserrat-ExtraBold` with ReportLab). Never fall back to
  Helvetica/Times for a template-based document.

- **Parallel delegation for document builds.** The Proposal stage spawns one
  sub-agent per document — one for invoice, one for receipt, one for proposal, one
  for contract — launched in parallel so output is fast. Every document agent works
  ONLY on its own PDF + its own build script and reports back independently.

- **Self-test before handoff.** Every document sub-agent runs its own verification
  before reporting done: `python scripts/verify_document.py clients/<slug>/facts.json
  <output.pdf>` must PASS, plus a pypdf text scan for leftover placeholders
  (`{{`, `}}`, `[`...`]` template tokens). No PASS, no handoff.

- **QA runs after ALL parallel tasks complete.** Only when every document agent has
  reported done + self-tested does the qa-proposal agent validate the whole set:
  template fidelity (especially invoice and receipt — they must look like the given
  reference templates), facts preserved verbatim, totals consistent across documents.

## Source

Feedback from Raymon — 2026-08-05. Applies to the Proposal Agent (invoice, receipt,
contract PDFs) and every agent that produces template-based output.
