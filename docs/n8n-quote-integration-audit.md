# n8n Text Agent + Quoting Agent — Integration Audit

Date: 2026-09-26
Status: **BLOCKED — decisions required from Raymon before any build**

## Inputs audited

| Artifact | Path | n8n workflow ID |
|---|---|---|
| Text agent | `c:\Users\lenovo\Downloads\Conversion0S _ Agent1 review.json` | `On1AWVSePFTjQfIt` |
| Quote workflow | `c:\Users\lenovo\Downloads\quote.json` | `9lYm64rYASjJm11j` |

Instance: self-hosted n8n on `http://localhost:5678` (both workflows already imported, both `active=false`).
API key stored in `.env` as `N8N_API_KEY` (gitignored). Never inline it in a file or prompt.

## Live instance state

Credentials present on the instance — only 3:

- `OpenAI account` (openAiApi)
- `Postgres account` (postgres)
- `Supabase account f1` (supabaseApi)

These are exactly the three the **text agent** needs. The **quote workflow** needs five credential
types that do not exist on this instance.

## B1 — The two workflows belong to different businesses (hard blocker)

| | Text agent | Quote workflow |
|---|---|---|
| Business | **Solar London** — solar panels, London/Canary Wharf | **JR Marketing Agency** — SEO / CRO / Web / Social |
| Persona | "Amy", reception team | Quote Agent (HTML row generator) |
| Qualification | home vs. commercial install; how many panels | match service names to a catalog |
| Booking | `www.bookhere.com`, 500+ Trustpilot reviews | n/a |
| Services | solar installation | Social Media Marketing, CRO, Website Build, SEO |

Connecting them as-is means a solar lead asking *"how much for 8 panels?"* is quoted for **SEO and
website build**. This is not a wiring bug — it is a semantically wrong system. The catalog and the
persona must be reconciled before any node is touched.

Evidence: `AI Conversation Agent` / `AI Intro Message Agent` systemMessage ("Amy … Solar London …
solar panel company") vs. quote `AI Agent` systemMessage ("Quote Agent for `[YOUR_AGENCY_NAME]`",
catalog list = the 4 marketing services).

## B2 — The quote workflow cannot execute on this instance at all

| Node | Credential required | Present? |
|---|---|---|
| `Get the deal`, `Get Company`, `Get Contact`, `Update deal`, `Create Follow-up task` | HubSpot (appToken) | **No** |
| `Create Customer` | Stripe | **No** |
| `Find Services` (the price catalog) | Google Sheets | **No** |
| `AI Agent` brain | Ollama `llama3.1:8b` | **No** (no Ollama credential/server) |
| `Email the Quote` | Gmail | **No** |
| `HTML to PDF` | community package `n8n-nodes-htmlcsstopdf` | unverified — not a stock node |

Nothing in the quote path can run today. Adding a trigger alone would produce an immediate failure,
not a working feature.

## B3 — CRM mismatch: GHL inbound vs. HubSpot deal inbound

- Text agent trigger: GHL form fill → `Webhook` `e94670d8-…` → `body.contact_id`,
  `body.customData['AI Type']`, `body['Message Aggregator']`. Replies go back out through
  `services.leadconnectorhq.com/hooks/…`. **No HubSpot anywhere.**
- Quote workflow trigger: `HubSpot Trigger` → `If` (fires only when
  `propertyValue == "presentationscheduled"`) → resolve deal → company → contact via HubSpot
  **associations** (`associatedCompanyIds`).

A GoHighLevel lead has no HubSpot deal and no associated company. Every one of those nodes resolves
empty, so `Build Quote Payload` produces `Notes: undefined`, `Budget: undefined`,
`Company Name: undefined`, and the agent is asked to quote from nothing.

Either (a) keep HubSpot and add a GHL→HubSpot deal-creation + association step, or (b) drop HubSpot
and drive the quote from the GHL contact. These are very different builds.

## B4 — Unreplaced placeholders in the quote workflow

Even with every credential present, current output ships literal placeholder text:

- `[YOUR_AGENCY_NAME]` (document title, `<h1>`, footer)
- `[YOUR_NAME]`, `[YOUR_EMAIL]`, `[YOUR_PHONE]`, `[YOUR_LOCATION]`
- `YOUR_GOOGLE_SHEET_ID`, `YOUR_GOOGLE_SHEET_URL` (also the cached sheet name
  "JR Marketing Agency Services Catalog")
- `Create Follow-up task` has a hardcoded due date `2025-12-07T13:56:37` — already in the past, so
  the task is created overdue the moment it fires.

File encoding is clean (UTF-8, no BOM, no U+FFFD). The odd `?` characters seen when dumping these
files are a PowerShell console artifact, **not** corruption in the source. Do not "fix" them.

## B5 — Structural fragility: the 3-input Merge stall

`AI Agent` output 0 fans out to three branches, which reconverge on `Merge` (`numberInputs: 3`):

```
AI Agent ─┬─ Build Customer ─ Create Customer ─┐                    (Merge input 0)
          ├─ Update Hubspot ─ Update deal ─────┤                    (Merge input 1)
          └─ HTML Payload ─ HTML to PDF ─ HTTP Request ─ Email the Quote ─┘  (Merge input 2)
                                                          Merge ─→ Create Follow-up task
```

`Merge` waits for **all three** inputs. If any one branch fails (Stripe auth, Gmail auth, the PDF
community package, an Ollama timeout) the merge never fires and the follow-up task is silently never
created. This is a latent silent failure, not a loud error — exactly what §9.7 forbids.

It also means the quote cannot be returned to the agent: the workflow's final output is a HubSpot
engagement, not the quote. There is currently **no path for a quote to reach the WhatsApp
conversation** even if everything else worked.

## Additional risk (not a blocker, but must be fixed)

The quote `AI Agent` runs on **Ollama `llama3.1:8b`** with `maxIterations: 3`, while the text agent
runs on **gpt-4.1**. A local 8B model is instructed to emit *only* `<tr>` rows containing exact
catalog prices, with strict prohibitions on placeholders. Small models drift on exactly this task.
Prices are the one value that must never be hallucinated. The instance already has a working
OpenAI credential — the quote brain should move to it, or the catalog must be applied
deterministically in code instead of by model.

## Proposed target architecture (pending decisions)

The wiring that actually works, and keeps quoting inside the conversation:

1. **Quote workflow becomes CRM-agnostic sub-workflow.** Replace `HubSpot Trigger` with
   `When Executed by Another Workflow` (`executeWorkflowTrigger`) taking a flat schema:
   `contact_id`, `contact_name`, `company`, `requested_services`, `conversation_notes`.
   Drop the HubSpot / Stripe / Gmail nodes from the conversational path.
2. **Catalog becomes deterministic.** Replace the `Find Services` Sheets tool with a static
   catalog (Set node / JSON) so prices come from data, not from a model. If Sheets must stay, it
   needs a real credential and a real sheet ID.
3. **Model swap.** Use the existing `OpenAI account` credential instead of Ollama, or drop the LLM
   from the pricing path entirely.
4. **Quote returns structured data**, e.g. `{ quote_rows, services, total_monthly, total_one_time }`,
   so the agent can render it as plain WhatsApp text (no HTML, no markdown).
5. **Text agent gains a Workflow Tool** (`@n8n/n8n-nodes-langchain.toolWorkflow`) on
   `AI Conversation Agent` pointed at the quote sub-workflow. The agent decides to call it.
6. **Prompt rules added** to the Conversation agent: on "how much / estimate / quote / pricing /
   package", call the tool once with a one-line summary, then relay only prices present in the tool
   result. Never state a price that is not in the tool output. Never send raw HTML.
7. **PDF / email / CRM write-back stay a separate, explicit path** — not inside the reply loop, which
   is where the B5 stall lives.

Then: Infrastructure Agent writes the spec → QA → Builder Agent implements and imports → QA Build
runs a real end-to-end quote-request test through the webhook.

## Decisions required from Raymon (blocking)

1. **Which business is the quote catalog for?** Solar (install/panels/batteries) or the marketing
   agency (SEO/CRO/Web/Social)? Or two separate clients?
2. **HubSpot in or out?** Keep HubSpot as the CRM (needs HubSpot creds + GHL→HubSpot deal creation),
   or run the quote purely off the GoHighLevel contact?
3. **How is the quote delivered?** In the WhatsApp chat (fastest, no email needed), emailed as a PDF,
   or both?
4. **Do these leads have email addresses?** GHL WhatsApp leads often have only a phone number. The
   current flow requires email.
5. **Where does the real price catalog live?** The Google Sheet ID is a placeholder. Real sheet ID,
   or hardcode the catalog into the workflow?
6. **Scope for v1:** chat-only quote (agent detects request → returns price table in chat), or the
   full PDF + email + CRM update + Stripe customer flow?
7. **Ollama** — is a local Ollama server intended to stay, or move the quote brain to the OpenAI
   credential already on the instance?

## Security note

The n8n public API key was shared in chat and has been written to `.env` as `N8N_API_KEY` (gitignored,
never committed). Rotate it if this instance is ever reachable from outside localhost.
