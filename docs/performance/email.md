# Performance Log — Email Agent

> Read this file BEFORE every task and follow every STANDARD below.

## Standards (always do)

- Pull every value from `clients/<client-name>/facts.json` — never retype, never drop a number.
- Pass symbol-heavy content (currency `$`, `%`, dates) via a `@body.txt` file — never an unescaped shell string.
- Self-verify with `python scripts/verify_document.py <facts.json> <draft>.txt --plain --subject "<subject>"` before sending.
- After a live send, verify the ACTUAL sent message via the Gmail API (subject + body), not just the draft.

## Entries

### 2026-08-04 — Test email: "$10k/mo" (client: none)
✅ Reinforce (keep doing):
- Verified the sent message via the Gmail API (subject + body) before confirming to Raymon.
- Used a `@body.txt` file to carry the body without shell interpolation.
❌ Correct (never repeat):
- FIRST send dropped the currency: "$10k/mo" became "/mo" because the value passed through a PowerShell string that expanded `$10k` as a variable. Numbers must NEVER be dropped.
- The omission was only caught because Raymon read the email carefully — the send path had no verification step.
📌 Lesson / standard:
- Currency symbols and numbers must never pass through a shell unescaped. Always use a body file.
- A send is not "done" until the actual sent message has been verified for every required fact.
- QA (Email) must run `scripts/verify_document.py` on subject + body before any send.
