# Performance Store

Persistent memory of how each sub-agent is doing. Purpose: agents learn what
"done right" looks like from real feedback, so standards compound instead of
being re-explained every time.

- **`proposal.md`** — Proposal Agent
- **`email.md`** — Email Agent
- **`infrastructure.md`** — Infrastructure Agent
- **`builder.md`** — Builder Agent

## How it works

1. After **every** completed task (small or complex), the Leader runs the
   `feedback` agent, which asks Raymon what was done right / wrong and records it.
2. Each log entry uses the format:

```
### <date> — <task> (client: <client-slug or none>)
✅ Reinforce (keep doing):
- ...
❌ Correct (never repeat):
- ...
📌 Lesson / standard:
- ...
```

3. Durable rules are merged into the **Standards** list at the top of each log.
4. **Before every task**, a sub-agent reads its own log (Standards section) and
   follows everything recorded there.

## Rules

- Entries are appended, never overwritten.
- No secrets, API keys, or client-confidential data in these logs.
- If a correction happens twice, the Feedback Agent escalates to the Leader —
  that means a prompt/process fix, not another log line.
