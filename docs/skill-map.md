# Skill Map — LaunchOps Onboarding Agent System

All skills are installed at `.opencode/.agents/skills/` (source of truth per
AGENTS.md §9.4). Registered via `skills.paths` in `opencode.json`.

| Skill | Location | Used by agent(s) | Purpose |
|---|---|---|---|
| `pdf` | `.opencode/.agents/skills/pdf` | proposal, qa-proposal | Read/extract/overlay text on PDFs, build output PDFs from templates |
| `proposal-writer` | `.opencode/.agents/skills/proposal-writer` | proposal | Proposal copy generation |
| `invoice-template` | `.opencode/.agents/skills/invoice-template` | proposal | Invoice generation from template |
| `prompt-engineer` | `.opencode/.agents/skills/prompt-engineer` | infrastructure | Write build-spec prompts, evaluation, anti-hallucination guardrails |
| `supabase` | `.opencode/.agents/skills/supabase` | builder, qa-build | Supabase schema/migrations/client wiring, verifying persisted events |
| `frontend-design` | `.opencode/.agents/skills/frontend-design` | builder, qa-build | Distinctive visual design of the dashboard |
| `design-qa-checklist` | `.opencode/.agents/skills/design-qa-checklist` | qa-build | QA checklists for design implementation accuracy |
| `code-review` | `.opencode/.agents/skills/code-review` | qa-build | Review the build diff against the spec before sign-off |

## Other resources

- **Templates (canonical):** `templates/` (mirrored in `.opencode/Template/`)
- **Dashboard reference images:** `.opencode/dashboard IMG/` (drop screenshots there for the Builder)
- **Environment keys:** `.env` (see `.env.example`)

## Note on skills AGENTS.md references

AGENTS.md mentions a dedicated `anti-hallucination-agent-skill`. It is not yet
installed; the `prompt-engineer` skill currently covers the anti-hallucination
guardrail requirement (AGENTS.md §5). If the dedicated skill is installed later,
the Infrastructure agent should prefer it.
