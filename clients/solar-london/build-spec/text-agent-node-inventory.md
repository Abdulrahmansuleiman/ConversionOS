# Text Agent Node Inventory — keep / delete / rebuild

| | |
|---|---|
| **Client slug** | `solar-london` |
| **Workflow** | `Conversion0S \| Agent1` |
| **n8n id** | `On1AWVSePFTjQfIt` |
| **Live state** | `active = false`, **64 nodes** |
| **Evidence file** | `clients/solar-london/build-spec/text-agent-LIVE.json` (58,760 bytes, dated 2026-09-26) |
| **Author** | Infrastructure Agent, revision pass 2.0 |
| **Purpose** | This is the work list. Raymon applies it node by node in the n8n canvas. It is not advisory. |

---

## 1. Why the live workflow cannot run — the confirmed root cause

`HubSpot Trigger` is **wired as a second entry point** into the text agent. In n8n a workflow with two
trigger nodes fires both. `HubSpot Trigger` has **no credential assigned**:

```
HubSpot Trigger  | n8n-nodes-base.hubspotTrigger | typeVersion 1 | credentials: ABSENT
  parameters: eventsUi.eventValues = [{ name: "deal.propertyChange", property: "dealstage" }]
```

So the moment the workflow is activated, this branch fires and errors. **This alone is why the live
text agent cannot run.** Every other problem in the live export is downstream of it, or is dead code
sitting on a branch that only this trigger can reach.

`Get a contact` is a **second** latent failure: it is
`n8n-nodes-base.highLevel` typeVersion 2 with `operation: "get"`, `requestOptions: {}`, **no
resource or identifier parameters at all, and no credential**. It appears **nowhere in the
`connections` object** — it is neither a source nor a target. It cannot execute even if something
tried to call it.

---

## 2. The arithmetic — 64 reconciles exactly

Every one of the 64 live nodes falls into exactly one of four buckets. There is no residue.

| Bucket | Count | What it is |
|---|---|---|
| ConversionOS core, functional | **36** | the three-lane agent that already works |
| Sticky notes | **8** | canvas annotations only |
| Pasted quote nodes, wired | **19** | the whole `LaunchOps Quoting Workflow`, pasted in as a second chain |
| Pasted quote nodes, dangling | **1** | `Get a contact` — not in `connections` at all |
| **Total** | **64** | |

```
 64 live
- 19 pasted quote nodes (wired)
-  1 pasted quote node (dangling)   <- Get a contact
-  1 quote sticky note              <- Sticky Note5, titled "Quote"
-----
 43  = the known-good 43-node core state
```

**`64 − 21 = 43`.** This is the strongest single check in this pass: the 43-node core the previous
spec referenced is not a guess, it is the exact remainder after removing the 19 wired quote nodes,
the 1 dangling quote node, and the 1 sticky note that labels the quote cluster. Apply this inventory
and the workflow returns to that state exactly.

Independently verified: all 19 node names in `quote-workflow-LIVE.json` are present in
`text-agent-LIVE.json` by name, and `quote-workflow-LIVE.json` contains **zero** nodes absent from
the text agent. The paste is a complete copy, not a partial one.

```
### 2.1 The pasted cluster, as wired

HubSpot Trigger -> If -> Get the deal -> Get Company -> Get Contact -> Build Quote Payload
                                                             -> AI Agent (+ Ollama Chat Model, Find Services tool)
        -> Merge (3 inputs) -> Create Follow-up task
        Merge in-1 <- Update Hubspot -> Update deal
        Merge in-2 <- HTML Payload -> HTML to PDF -> HTTP Request4 -> Email the Quote
        Merge in-3 <- Build Customer -> Create Customer
```

Every one of those 20 nodes is on the `HubSpot Trigger` branch. **None of them is reachable from the
GHL webhook.** They are a self-contained second workflow living inside the first one's canvas, and
its only entry point is the trigger that has no credential.

---

## 3. Full inventory — all 64 live nodes, in export order

`cred` = the credential key on the node as exported. `NONE` = `credentials` key absent from the
export. Node counts are export position, not alphabetical.

### 3.1 ConversionOS core — KEEP (36 functional nodes)

| # | Node | Type | Verdict | Note |
|---|---|---|---|---|
| 1 | `Webhook` | `base.webhook` | **KEEP — no change** | `POST e94670d8-d66d-499f-9460-f00e6cbd1fa1`. The GHL entry point. |
| 2 | `Sticky Note` | `base.stickyNote` | **KEEP** | "ConversionOS AI Text Agent" |
| 3 | `Switch` | `base.switch` | **KEEP — no change** | Routes on `body.customData['AI Type']` into the 3 lanes. |
| 4 | `Sticky Note1` | `base.stickyNote` | **KEEP** | "AI Intro Message Agent" |
| 5 | `Sticky Note2` | `base.stickyNote` | **KEEP** | "AI Conversation Agent" |
| 6 | `Sticky Note3` | `base.stickyNote` | **KEEP** | "AI Follow Up Agent" |
| 7 | `Chat Memory Manager` | `lc.memoryManager` | **KEEP — no change** | Conversation lane. |
| 8 | `Postgres Chat Memory` | `lc.memoryPostgresChat` | **KEEP — no change** | cred `postgres`. Sub-node of 5 agents/managers. Table name is mixed-case `Launchops_chat_memory` — do not rename. |
| 9 | `Supabase Vector Store` | `lc.vectorStoreSupabase` | **KEEP — no change** | cred `supabaseApi`. `ai_tool` on both agents. |
| 10 | `Embeddings OpenAI` | `lc.embeddingsOpenAi` | **KEEP — no change** | cred `openAiApi`. |
| 11 | `Chat Memory Manager1` | `lc.memoryManager` | **KEEP — no change** | Intro lane. |
| 12 | `Chat Memory Manager2` | `lc.memoryManager` | **KEEP — no change** | Follow Up lane. |
| 13 | `OpenAI Chat Model` | `lc.lmChatOpenAi` | **KEEP — no change** | cred `openAiApi`. Model `gpt-4.1` per decision 5. Sub-node of 6 chains. |
| 14 | `Sticky Note4` | `base.stickyNote` | **KEEP** | "AI Configuration" |
| 15 | `Segment Response` | `lc.agent` | **KEEP — no change** | Conversation-lane splitter. |
| 16 | `AI Conversation Agent` | `lc.agent` | **KEEP + MODIFY** | The **only** core node this project changes. Append the systemMessage block (spec §9). No other parameter, no other field. |
| 17 | `Classify (Human/AI)` | `lc.textClassifier` | **KEEP — no change** | One category `Human`, fallback `other`. Verified: a price question routes to the **AI** branch. Do not add a pricing category (spec §8.4). |
| 18 | `Follow Up AI` | `lc.chainLlm` | **KEEP — no change** | Follow-up lane. |
| 19 | `Follow Up JSON` | `lc.outputParserStructured` | **KEEP — no change** | |
| 20 | `Response JSON` | `lc.outputParserStructured` | **KEEP — no change** | `ai_outputParser` on `Segment Response` + `Segment Response1`. |
| 21 | `HTTP Request1` | `base.httpRequest` | **KEEP — no change** | Conversation lane → GHL. Body `Contact ID` + `Message1..5` + `Conversation History`. `Using Parameters`. |
| 22 | `HTTP Request2` | `base.httpRequest` | **KEEP — no change** | Human handoff → GHL. Body `Contact ID` only. |
| 23 | `HTTP Request3` | `base.httpRequest` | **KEEP — no change** | Follow-up → GHL. Body `Contact ID` + `Follow Up Status` + `FollowUpMessage`. |
| 24 | `HTTP Request` | `base.httpRequest` | **KEEP — no change** | **Intro lane → GHL.** Named `HTTP Request` with no digit. This is a core node, not a quote node. Do not confuse it with `HTTP Request4` below. |
| 25 | `Segment Response1` | `lc.agent` | **KEEP — no change** | Intro-lane splitter. |
| 26 | `AI Intro Message Agent` | `lc.agent` | **KEEP — no change** | Gets no quote tool (spec §17.5 Q27). |
| 27 | `Set Contact ID` | `base.set` | **KEEP — no change** | `Contact ID` = `{{ $json.body.contact_id }}`. This is the dashboard `client_id`. |
| 28 | `Google Drive Trigger` | `base.googleDriveTrigger` | **KEEP — no change** | KB ingestion leg 1. |
| 29 | `Download file` | `base.googleDrive` | **KEEP — no change** | |
| 30 | `Sticky Note6` | `base.stickyNote` | **KEEP** | "Knowledge Base - File Created" |
| 31 | `Supabase Vector Store1` | `lc.vectorStoreSupabase` | **KEEP — no change** | |
| 32 | `Embeddings OpenAI1` | `lc.embeddingsOpenAi` | **KEEP — no change** | |
| 33 | `Default Data Loader` | `lc.documentDefaultDataLoader` | **KEEP — no change** | |
| 34 | `Recursive Character Text Splitter` | `lc.textSplitterRecursiveCharacterTextSplitter` | **KEEP — no change** | |
| 35 | `Sticky Note7` | `base.stickyNote` | **KEEP** | "Knowledge Base - File Updated" |
| 36 | `Google Drive Trigger1` | `base.googleDriveTrigger` | **KEEP — no change** | KB ingestion leg 2. |
| 37 | `Download file1` | `base.googleDrive` | **KEEP — no change** | |
| 38 | `Supabase Vector Store2` | `lc.vectorStoreSupabase` | **KEEP — no change** | |
| 39 | `Embeddings OpenAI2` | `lc.embeddingsOpenAi` | **KEEP — no change** | |
| 40 | `Default Data Loader1` | `lc.documentDefaultDataLoader` | **KEEP — no change** | |
| 41 | `Recursive Character Text Splitter1` | `lc.textSplitterRecursiveCharacterTextSplitter` | **KEEP — no change** | |
| 42 | `Clear Documents Table` | `base.httpRequest` | **KEEP — no change** | Clears the store before re-ingest, leg 1. |
| 43 | `Clear Documents Table1` | `base.httpRequest` | **KEEP — no change** | Leg 2. |

### 3.2 Pasted quote cluster — DELETE (20 nodes)

Every one of these is either on the credential-less `HubSpot Trigger` branch or dangling. None is
reachable from the GHL webhook. None is required by decision 1-7.

| # | Node | Type | Verdict | Why delete |
|---|---|---|---|---|
| 44 | `HubSpot Trigger` | `base.hubspotTrigger` | **DELETE** | **The reason the live workflow cannot run.** Second entry point, zero credentials. Also decision 2: HubSpot is OUT. |
| 45 | `AI Agent` | `lc.agent` | **DELETE** | Its own prompt says *"A new lead has entered the [YOUR_AGENCY_NAME] quoting system"* and its systemMessage says *"You are the Quote Agent for [YOUR_AGENCY_NAME]"*. It builds pricing **inside an LLM** — the exact thing this spec exists to remove. Its replacement (`Quote Summary AI`) is a separate node in a separate workflow. |
| 46 | `Ollama Chat Model` | `lc.lmChatOllama` | **DELETE** | Model `llama3.1:8b`, no credential. Decision 5: OpenAI only. |
| 47 | `Merge` | `base.merge` | **DELETE** | 3 inputs. Root cause of the "silently never fires" defect: if any one branch fails, the merge never runs and the follow-up task is never created. No Merge node exists in the new graph. |
| 48 | `Update Hubspot` | `base.set` | **DELETE** | Sets `Task: "Follow-up"`, empty `Quote`. HubSpot (decision 2). |
| 49 | `Update deal` | `base.hubspot` | **DELETE** | `updateFields.pipeline: "Quote Sent"`. HubSpot. |
| 50 | `Create Follow-up task` | `base.hubspot` | **DELETE** | HubSpot. Also carries `dueDate: 2025-12-07T13:56:37`, **already in the past** — the task is created overdue on arrival. |
| 51 | `Get the deal` | `base.hubspot` | **DELETE** | HubSpot. |
| 52 | `Build Quote Payload` | `base.set` | **DELETE** | Reads HubSpot deal/company properties. Replaced by `Validate Input` in the sub-workflow. |
| 53 | `Email the Quote` | `base.gmail` | **DELETE** | **The single worst node in the live export.** No credential; `sendTo: "recipient@example.com"`; `subject: "Here is your quote from [YOUR_AGENCY_NAME]"`; body is a marketing-agency email containing `detailed marketing services quote`, `growth-focused marketing partner`, `paid traffic systems (Meta, Google, and beyond)`, `Dial in your funnels and landing pages for higher conversion rates`, `Turn cold traffic into qualified leads and repeat customers`, `Transparent pricing for monthly and one-time project work`. Replaced by `Send Quote Email` in the sub-workflow. |
| 54 | `Get Company` | `base.hubspot` | **DELETE** | HubSpot. |
| 55 | `Get Contact` | `base.hubspot` | **DELETE** | HubSpot. Note: this is **not** `Get a contact` (#64). |
| 56 | `Find Services` | `base.googleSheetsTool` | **DELETE** | Decision 6: no Google Sheets. Its cached values still name a **different business**: `cachedResultName: "JR Marketing Agency Services Catalog"`, with `YOUR_GOOGLE_SHEET_ID` / `YOUR_GOOGLE_SHEET_URL` placeholders. Replaced by the `Load Catalog` Code node. |
| 57 | `If` | `base.if` | **DELETE** | `{{ $json.propertyValue }}` equals `presentationscheduled` — a HubSpot deal-stage name. |
| 58 | `Build Customer` | `base.set` | **DELETE** | Stripe (decision 3). Carries `Country: "=US"`, `State`, `Zip Code` — a **US** customer shape. Solar London is a UK business. |
| 59 | `Create Customer` | `base.stripe` | **DELETE** | Stripe, no credential. |
| 60 | `HTML to PDF` | `n8n-nodes-htmlcsstopdf.htmlcsstopdf` | **DELETE** | Community package, no credential. Its input is `html_content: ={{ $json.Quote }}` from `HTML Payload`. **v1 does not generate a PDF** (spec §6.4). See the availability check in §5 below. |
| 61 | `HTML Payload` | `base.set` | **DELETE** | The old marketing quote document. Contains `<h1>[YOUR_AGENCY_NAME] - Service Quote</h1>`, the tagline `Custom Strategy. Transparent Pricing. Built to Scale Your Brand.`, and table headers **`Monthly Price`**, **`One-Time Price`**, `Turnaround` — a retainer-agency shape, not a solar one. Also emits `{{ new Date().toLocaleDateString() }}`, which is locale-dependent and therefore not reproducible. Replaced by `Build Quote Document` in the sub-workflow. |
| 62 | `HTTP Request4` | `base.httpRequest` | **DELETE** | **Inspected, as instructed.** `url: ={{ $json.pdf_url }}`, `responseFormat: file`, positioned at `[12224, 2544]` inside the quote cluster, wired `HTML to PDF → HTTP Request4 → Email the Quote`. It is the quote workflow's **fetch-the-rendered-PDF** step and has **no other role**. Nothing in the ConversionOS core references `pdf_url`; the only producer of `pdf_url` is `HTML to PDF`. **Verdict: quote-related, delete.** (The Intro-lane GHL sender is node #24, `HTTP Request`, a different node with a different name.) |
| 63 | `Sticky Note5` | `base.stickyNote` | **DELETE** | Content is exactly `## Quote` at `[9968, 2336]` — it labels the pasted cluster and has no role once the cluster is gone. |
| 64 | `Get a contact` | `base.highLevel` | **DELETE** | `operation: "get"`, `requestOptions: {}`, **no resource or identifier parameters, no credential**, and **absent from the `connections` object entirely** — not a source, not a target. Dangling dead node. Also the only GHL-API node in the export, and the GHL private integration token could not be validated, so this path is not buildable (spec §6.2). |

### 3.3 New — ADD (1 node)

| # | Node | Type | Verdict | Note |
|---|---|---|---|---|
| — | `solar_london_quote` | `@n8n/n8n-nodes-langchain.toolWorkflow` | **ADD** | `Workflow from` = the rebuilt `LaunchOps Quoting Workflow`. Connect its `ai_tool` output to `AI Conversation Agent` alongside the existing `Supabase Vector Store`. Needs no credential of its own. Full config in spec §8. |

---

## 4. Totals

| | Count |
|---|---|
| Live nodes before | **64** |
| **KEEP, unchanged** | 42 |
| **KEEP + MODIFY** (`AI Conversation Agent`) | 1 |
| **DELETE** | **21** |
| Live nodes after clean-up | **43** |
| **ADD** (`solar_london_quote`) | **1** |
| **Final node count** | **44** |

**43 kept is the known-good core. 44 is the shipped workflow.**

The quote sub-workflow is a **separate n8n workflow**, so it does not appear in this table. It is
built from scratch, node by node, in spec §5. It is never pasted back into the text agent.

---

## 5. Community node availability — VERIFY, do not assume

`HTML to PDF` is `n8n-nodes-htmlcsstopdf.htmlcsstopdf`, a **community package, not a stock n8n
node**. Its presence in an imported workflow is *evidence* that the package was installed when the
import happened. It is **UNVERIFIED** and stays UNVERIFIED until someone runs one of these at stage
S3 and records the result in the build report:

1. **Node search** — type `html` in n8n's node search panel. An "HTML to PDF" / "HTMLCSStoPDF"
   entry means installed.
2. **Open the node** — open `LaunchOps Quoting Workflow` and click `HTML to PDF`. A red
   *"unrecognized node type"* banner means not installed.
3. **Container, read-only** — `docker exec <n8n-container> npm ls n8n-nodes-htmlcsstopdf`, and/or
   `docker exec <n8n-container> sh -lc "ls node_modules | grep htmlcsstopdf"`.
4. **Server log** — a missing community package logs an "unrecognized nodes" / "Node type … not
   found" line at n8n startup.

**v1 does not need this node and does not use it** (spec §6.4 ships a styled HTML email, no
attachment). So the answer does not gate the build. Record it anyway — it decides whether the v1.1
PDF tail in spec §16 is buildable or needs a different renderer. **Do not install any community
package into Raymon's production n8n without his explicit go-ahead.**

---

## 6. Apply-this checklist

Work top to bottom in the n8n canvas. Do not skip ahead.

- [ ] **1.** Export the live workflow again, dated, and save it to
      `clients/solar-london/build-spec/text-agent-LIVE-<YYYYMMDD>.json`. This export is the rollback
      point. **Nothing below happens before this file exists on disk.**
- [ ] **2.** Confirm the export reports **64 nodes** and `active = false`. If either differs from
      this document, **stop** and report back to the Leader — the instance changed after this
      analysis and the inventory no longer applies.
- [ ] **3.** Select and delete the 21 nodes in §3.2. Deleting the 19 wired nodes removes the entire
      `HubSpot Trigger` branch, including the 3-input `Merge` and the 3-input `Merge` fan-in.
- [ ] **4.** Delete `Get a contact` (#64). It is dangling, so no connection is left dangling.
- [ ] **5.** Delete `Sticky Note5` (#63).
- [ ] **6.** Confirm the canvas now shows **43 nodes** and that the only remaining trigger is
      `Webhook`. If any node shows a broken/exclamation connection marker, a delete was incomplete —
      reconnect before continuing.
- [ ] **7.** Confirm nothing on the canvas is orange/red for missing credentials. Expected result:
      zero missing-credential markers. `Postgres Chat Memory` → `postgres`, `Supabase Vector Store*`
      → `supabaseApi`, `Embeddings OpenAI*` and `OpenAI Chat Model` → `openAiApi`.
- [ ] **8.** Append the systemMessage block (spec §9) to `AI Conversation Agent` →
      `Options → System Message`, at the very end. Change nothing else on that node.
- [ ] **9.** Build the quote sub-workflow as a **separate workflow** (spec §5). Do not paste it into
      this canvas.
- [ ] **10.** Add `solar_london_quote` (spec §8.1) and connect its `ai_tool` output to
      `AI Conversation Agent`.
- [ ] **11.** Confirm the canvas now shows **44 nodes**.
- [ ] **12.** Save. Leave `active = false` until stage S9.
- [ ] **13.** Run the regression grep in spec §15 over the new export. It must return **zero**
      matches for every forbidden token.

---

## 7. What the Builder must record in the build report

- The dated export filename from step 1.
- The node count observed at step 2 and at step 6.
- The `htmlcsstopdf` availability result and which of the four methods in §5 produced it.
- Any node that could not be deleted or connected, named exactly.
- The result of the regression grep, quoted verbatim including the count of matches per token.
