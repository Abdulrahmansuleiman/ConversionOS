# Performance Log — Proposal Agent

> Read this file BEFORE every task and follow every STANDARD below.

## Standards (always do)

- Build every PDF from `clients/<client-name>/facts.json` — never retype or re-derive numbers, currency, dates, or names.
- Every value that appears in ANY output must be listed in the fact sheet's `must_appear`.
- Run `python scripts/verify_document.py <facts.json> <output.pdf>` on every PDF before handoff.
- Template structure is canonical — never freelance formatting.
- Template structure is a hard constraint, not a suggestion. Never create sections, fields, or layouts outside the given template — especially for invoice and receipt PDFs. If the template lacks something needed, stop and flag the Leader Agent.
- Documents use Montserrat from fonts/Montserrat/ (register with ReportLab) — never Helvetica/Times.
- Document stage runs one sub-agent per PDF in parallel; QA validates the full set only after all finish.
- Spacing audit on every PDF before handoff: no clustered/crowded text, no overlapping words — especially signature blocks (name/title/date). Aim for polished, breathable layout.

## Entries

<!-- Feedback Agent appends entries here. Seed entry below. -->

### 2026-08-04 — System hardening (client: none)
✅ Reinforce (keep doing):
- Cross-document consistency checks (proposal = contract = invoice totals).
📌 Lesson / standard:
- The "$10k/mo → /mo" bug (dropped currency via shell interpolation) applies to PDFs too.
  All numbers must be verified programmatically, not by eye.

### 2026-08-05 — Template structure adherence for invoice/receipt/contract (client: none)
❌ Correct (never repeat):
- Never create output outside the given template structure. Proposal, contract, invoice, and receipt must follow the canonical templates exactly — no redesigned sections, no invented fields, no rearranged layout.
- Especially for INVOICE and RECEIPT: the template structure is mandatory. Design outside the template is out of scope.
📌 Lesson / standard:
- When a template is missing something a client needs, stop and flag the Leader Agent — never improvise a new section.
- Template structure is a hard constraint, not a suggestion (AGENTS.md §9.5).

### 2026-08-05 — Parallel document build workflow + Montserrat (client: bloomline-apparel)
✅ Reinforce (keep doing):
- Delegate one sub-agent per document (invoice / receipt / proposal / contract) and run them in parallel for speed.
- Self-test every PDF (verify_document.py + placeholder scan) before handoff.
- QA the full set AFTER all parallel tasks complete.
❌ Correct (never repeat):
- Never fall back to Helvetica/Times — Montserrat (fonts/Montserrat/) is the LaunchOps document font.
- Never redesign or add anything outside the reference template structure — especially invoice and receipt.
📌 Lesson / standard:
- Parallel document sub-agents: each touches only its own output PDF + its own build script.
- Montserrat registered via reportlab TTFont: Montserrat, -Bold, -Italic, -BoldItalic, -Medium, -SemiBold, -ExtraBold.

### 2026-08-05 — Parallel build feedback (client: bloomline-apparel)
✅ Reinforce (keep doing):
- Parallel one-agent-per-document builds (invoice / receipt / proposal / contract) — fast and clean.
- Montserrat typography; self-testing with verify_document.py before handoff.
- QA catching fact distortions (e.g. "40-50 orders per month" → "40-50 inbound messages per day").
❌ Correct (never repeat):
- No clustered/crowded text: signature blocks (name/title/date lines) and any dense areas must have clean vertical spacing and no overlapping/colliding words.
📌 Lesson / standard:
- Every PDF gets a spacing audit (pdfplumber word-overlap / line-gap check) before handoff, especially signature and name/title blocks.
- Aim for "amazing" — polished, breathable layout, not just factually correct.
