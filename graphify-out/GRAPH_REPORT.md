# Graph Report - onboarding-agent  (2026-08-20)

## Corpus Check
- 232 files · ~368,613 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1631 nodes · 2538 edges · 121 communities (93 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97d182a0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- bloomline-dashboard/server/index.js
- notion.js
- pipeline-dashboard/server/app.js
- bloomline-dashboard/src/tabs/BookingsTab.tsx
- build_proposal.py
- bloomline-dashboard/src/types/events.ts
- build_contract.py
- bloomline-dashboard/src/tabs/DashboardTab.tsx
- ProjectDetail.tsx
- notion-init.js
- launchops-portal/src/components/ui.tsx
- Overview.tsx
- pipeline-dashboard/src/api/client.ts
- launchops-portal/src/components/Sidebar.tsx
- PDF Processing Advanced Reference
- Testimonials.tsx
- opencode.json
- pipeline-dashboard/src/tabs/DashboardTab.tsx
- pipeline-dashboard/src/tabs/BookingsTab.tsx
- SpeedTrendChart.tsx
- pipeline-dashboard/src/types/events.ts
- Proposal Writer
- bloomline-dashboard/src/components/Sidebar.tsx
- bloomline-dashboard/src/api/client.ts
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- Projects.tsx
- pipeline-dashboard/src/components/Sidebar.tsx
- devDependencies
- Documents.tsx
- pipeline-dashboard/src/components/Header.tsx
- notion-seed.js
- Leader Agent (Orchestrator)
- LoginScreen.tsx
- Non-fillable fields
- bloomline-dashboard/src/components/KpiCard.tsx
- build_receipt.py
- Leader Agent
- scripts
- dependencies
- seed-demo.js
- notion-upload-document.mjs
- bloomline-dashboard/src/components/ErrorBoundary.tsx
- launchops-portal/src/App.tsx
- launchops-portal/src/theme.ts
- pipeline-dashboard/src/components/ErrorBoundary.tsx
- label-notion-databases.mjs
- Changelog
- pipeline-dashboard/src/components/charts/ConversionDonut.tsx
- dependencies
- QA Categories
- bloomline-dashboard/src/components/charts/WeeklyTrend.tsx
- bloomline-dashboard/src/components/Header.tsx
- notion-fix-schema.js
- set-vercel-env.mjs
- dependencies
- Process
- Bloomline Apparel Text AI Agent
- launchops-portal/vercel.json
- Invoice Template Skill
- Icon Library
- pipeline-dashboard/vercel.json
- @types/react-dom
- pipeline-dashboard/src/components/TimeframeToggle.tsx
- inventory-notion-pages.mjs
- send_email.py
- Bloomline Document Build Plan
- bloomline-dashboard/src/components/charts/ConversionDonut.tsx
- Process
- Frontend Design
- feedback-issue-template.md
- eslint-plugin-react-refresh
- Pipeline — Agent Report Dashboard
- bloomline-dashboard/src/components/TimeframeToggle.tsx
- wrap
- extract_form_structure.py
- bloomline-dashboard/tsconfig.json
- bloomline-dashboard/package.json
- launchops-portal/tsconfig.json
- Performance Log — Email Agent
- check_bounding_boxes.py
- graphify.js
- pipeline-dashboard/tsconfig.json
- Performance Log — Builder Agent
- Bloomline Dashboard Index
- Bloomline Dashboard README
- n8n Dashboard Nodes Config
- Clients Workspace README
- Proposal Agent Performance Log
- LaunchOps Runbook
- Skill Map
- Canvas Design Skill
- Context Management
- Evaluation Frameworks
- Prompt Optimization
- Prompt Patterns
- Structured Outputs
- Favicon
- Pipeline Logo
- Contract Template
- Invoice Template
- Proposal Template
- Receipt Template
- Performance Log — Infrastructure Agent
- Performance Store
- eslint
- vite

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 18 edges
4. `useFetch()` - 17 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `formatDate()` - 15 edges
9. `useFetch()` - 15 edges
10. `main()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Bloomline Document Build Plan` --references--> `Invoice Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Invoice Template.pdf
- `Bloomline Document Build Plan` --references--> `Proposal Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Proposal Template.pdf
- `Bloomline Document Build Plan` --references--> `Receipt Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Receipt Template.pdf
- `n8n Dashboard Nodes Config` --conceptually_related_to--> `ConversionOS n8n Workflow`  [EXTRACTED]
  dashboard-nodes-to-add.txt → N8N_WORKFLOW.png
- `generate_client_proposal_pdf()` --calls--> `build_table()`  [INFERRED]
  modal_proposal_agent.py → clients/bloomline-apparel/build_proposal.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Bloomline Apparel Onboarding Flow** — clients_bloomline_apparel_bloomline_docs_plan, clients_bloomline_apparel_build_spec_dashboard_build_spec, clients_bloomline_apparel_pdfs_contract [EXTRACTED 1.00]
- **Dashboard Infrastructure Stack** — docs_data_model, docs_playbooks_client_dashboard_build, n8n, gohighlevel [EXTRACTED 1.00]
- **Dashboard Tech Stack** — bloomline_dashboard_readme, bloomline_dashboard_index, clients_bloomline_apparel_build_spec_dashboard_build_spec [EXTRACTED 1.00]
- **Onboarding Pipeline Flow** — agents_proposal_agent, agents_email_agent, agents_infrastructure_agent, agents_builder_agent [EXTRACTED 1.00]
- **QA Validation Layer** — agents_qa_agent_proposal, agents_qa_agent_email, agents_qa_agent_infra, agents_qa_agent_build [EXTRACTED 1.00]
- **LaunchOps Onboarding Flow** — opencode_agent_leader, opencode_agent_proposal, opencode_agent_email, opencode_agent_infrastructure, opencode_agent_builder [EXTRACTED]
- **Prompt Engineering Skillset** — opencode_agents_skills_prompt_engineer_references_context_management, opencode_agents_skills_prompt_engineer_references_evaluation_frameworks, opencode_agents_skills_prompt_engineer_references_prompt_optimization, opencode_agents_skills_prompt_engineer_references_prompt_patterns, opencode_agents_skills_prompt_engineer_references_structured_outputs, opencode_agents_skills_prompt_engineer_references_system_prompts [EXTRACTED]
- **Dashboard Visual Assets** — pipeline_dashboard_public_favicon, pipeline_dashboard_public_icons, pipeline_dashboard_public_pipeline [INFERRED 0.85]
- **Data Persistence Stack** — opencode_agents_skills_notion_project_store, agents_builder_agent, dashboard_nodes_config [INFERRED 0.85]
- **Business Document Templates** — templates_contract_template, templates_invoice_template, templates_proposal_template, templates_receipt_template [INFERRED 0.90]

## Communities (121 total, 28 thin omitted)

### Community 0 - "bloomline-dashboard/server/index.js"
Cohesion: 0.06
Nodes (38): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+30 more)

### Community 1 - "notion.js"
Cohesion: 0.09
Nodes (36): app, createApp(), issueToken(), loginRouter(), requireAuth(), secret(), sign(), verifyToken() (+28 more)

### Community 2 - "pipeline-dashboard/server/app.js"
Cohesion: 0.06
Nodes (43): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+35 more)

### Community 3 - "bloomline-dashboard/src/tabs/BookingsTab.tsx"
Cohesion: 0.06
Nodes (71): Content, MainArea, BookingChip, BookingTime, CalendarGrid(), CalendarGridProps, DayCell, DayHeader (+63 more)

### Community 4 - "build_proposal.py"
Cohesion: 0.09
Nodes (27): build_table(), bullets(), draw_chrome(), draw_cover(), esc(), h1(), h2(), NumberedCanvas (+19 more)

### Community 5 - "bloomline-dashboard/src/types/events.ts"
Cohesion: 0.19
Nodes (16): api, useCalendar(), FetchState, useFetch(), useKpis(), useTopLeads(), useTrend(), DashboardTab() (+8 more)

### Community 6 - "build_contract.py"
Cohesion: 0.09
Nodes (28): build(), build_story(), draw_content_decor(), draw_cover(), main(), Main section heading + the template's dark-navy underline rule., Two-column acceptance block (CLIENT / LAUNCHOPS AI)., Remove ReportLab's unused Helvetica page-resource entry (no glyphs use it).… (+20 more)

### Community 7 - "bloomline-dashboard/src/tabs/DashboardTab.tsx"
Cohesion: 0.10
Nodes (20): DarkCard, DarkCardHeader, DarkSub, DarkTitle, KPI_META, KpiGrid, KpiRow, LeadBar (+12 more)

### Community 8 - "ProjectDetail.tsx"
Cohesion: 0.05
Nodes (35): AdvanceBtn, AssetContent, AssetIcon, AssetLink, AssetList, AssetName, AssetRow, AssetType (+27 more)

### Community 9 - "notion-init.js"
Cohesion: 0.10
Nodes (29): api(), ASSET_TYPES, chk(), createDatabase(), date(), __dirname, DOC_STATUS, DOC_TYPES (+21 more)

### Community 10 - "launchops-portal/src/components/ui.tsx"
Cohesion: 0.09
Nodes (26): Avatar(), Badge, Card(), CardShell, Circle, Dot, Empty, Fill (+18 more)

### Community 11 - "Overview.tsx"
Cohesion: 0.08
Nodes (26): ChartBox, FeedDate, FeedList, FeedRow, FeedTitle, Grid2, Hero, HeroLabel (+18 more)

### Community 12 - "pipeline-dashboard/src/api/client.ts"
Cohesion: 0.18
Nodes (16): api, ApiError, useCalendar(), FetchState, useFetch(), useKpis(), useSpeedTrend(), useTopLeads() (+8 more)

### Community 13 - "launchops-portal/src/components/Sidebar.tsx"
Cohesion: 0.08
Nodes (24): ActiveBar, Aside, Brand, Footer, Idx, items, LogoMark, LogoutBtn (+16 more)

### Community 14 - "PDF Processing Advanced Reference"
Cohesion: 0.04
Nodes (46): 1. For Large PDFs, 2. For Text Extraction, 3. For Image Extraction, 4. For Form Filling, 5. Memory Management, Advanced Command-Line Operations, Advanced Encryption, Advanced Image Conversion (+38 more)

### Community 15 - "Testimonials.tsx"
Cohesion: 0.14
Nodes (13): Loading(), ApproveBtn, BadgePending, Bottom, Card, ClientName, ClientSub, Grid (+5 more)

### Community 16 - "opencode.json"
Cohesion: 0.09
Nodes (23): command, enabled, type, default_agent, NOTION_API_TOKEN, instructions, mcp, canva (+15 more)

### Community 17 - "pipeline-dashboard/src/tabs/DashboardTab.tsx"
Cohesion: 0.09
Nodes (22): DarkCard, DarkCardHeader, DarkSub, DarkTitle, handoverSubtitle(), KPI_META, KpiGrid, KpiRow (+14 more)

### Community 18 - "pipeline-dashboard/src/tabs/BookingsTab.tsx"
Cohesion: 0.06
Nodes (72): Content, MainArea, BookingChip, BookingTime, CalendarGrid(), CalendarGridProps, DayCell, DayHeader (+64 more)

### Community 19 - "SpeedTrendChart.tsx"
Cohesion: 0.15
Nodes (15): App(), ChartWrap, formatHours(), SpeedTrendChart(), SpeedTrendChartProps, ChartWrap, WeeklyTrend(), WeeklyTrendProps (+7 more)

### Community 20 - "pipeline-dashboard/src/types/events.ts"
Cohesion: 0.13
Nodes (17): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+9 more)

### Community 21 - "Proposal Writer"
Cohesion: 0.09
Nodes (22): Call to Action, Customization Options, Example: SaaS Implementation Proposal, Examples, Executive Summary, Executive Summary, How to Use, HR Software Implementation Proposal (+14 more)

### Community 23 - "bloomline-dashboard/src/components/Sidebar.tsx"
Cohesion: 0.11
Nodes (16): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+8 more)

### Community 24 - "bloomline-dashboard/src/api/client.ts"
Cohesion: 0.39
Nodes (4): ApiError, useUsers(), AddUserInput, DashboardUser

### Community 25 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+15 more)

### Community 26 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 27 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+15 more)

### Community 28 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 29 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+15 more)

### Community 30 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 31 - "Projects.tsx"
Cohesion: 0.13
Nodes (18): Header(), daysUntil(), formatDate(), Feedback(), ProjectDetail(), Dates, Footer, GoBtn (+10 more)

### Community 33 - "pipeline-dashboard/src/components/Sidebar.tsx"
Cohesion: 0.11
Nodes (16): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+8 more)

### Community 34 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, concurrently, @eslint/js, eslint-plugin-react-hooks, globals, @types/react, typescript, typescript-eslint (+9 more)

### Community 35 - "Documents.tsx"
Cohesion: 0.14
Nodes (14): EmptyState(), Client, DocName, Documents(), DownloadLink, Head, Notes, PaidLine (+6 more)

### Community 36 - "pipeline-dashboard/src/components/Header.tsx"
Cohesion: 0.16
Nodes (12): Badge, DevModeBadge(), Bar, BellButton, DateLabel, Header(), Right, Subtitle (+4 more)

### Community 37 - "notion-seed.js"
Cohesion: 0.22
Nodes (13): api(), __dirname, facts, findProject(), HEADERS, queryAll(), relOf(), root (+5 more)

### Community 38 - "Leader Agent (Orchestrator)"
Cohesion: 0.14
Nodes (14): Builder Agent, Email Agent, Feedback Agent, Infrastructure Agent, Leader Agent (Orchestrator), Proposal Agent, QA Agent (Build), QA Agent (Email) (+6 more)

### Community 39 - "LoginScreen.tsx"
Cohesion: 0.14
Nodes (13): Button, Error, Eyebrow, Foot, Form, Input, LoginScreen(), Logo (+5 more)

### Community 41 - "Non-fillable fields"
Cohesion: 0.11
Nodes (18): A.1: Analyze the Structure, A.2: Check for Missing Elements, A.3: Create fields.json with PDF Coordinates, A.4: Validate Bounding Boxes, Approach A: Structure-Based Coordinates (Preferred), Approach B: Visual Estimation (Fallback), B.1: Convert PDF to Images, B.2: Initial Field Identification (+10 more)

### Community 42 - "bloomline-dashboard/src/components/KpiCard.tsx"
Cohesion: 0.19
Nodes (12): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+4 more)

### Community 43 - "build_receipt.py"
Cohesion: 0.15
Nodes (9): draw(), find(), protect(), Keep phone numbers and 'N days' phrases atomic so wrapping never splits them., # NOTE: template ARRIVE / DEPART travel fields omitted (no facts, N/A) -…, Return the exact must_appear token starting with `prefix`., Draw `text` at x with its glyph top at `top` (distance from page top)., Greedy word wrap by measured width; returns list of lines (no mid-word splits). (+1 more)

### Community 44 - "Leader Agent"
Cohesion: 0.21
Nodes (13): Builder Agent, Email Agent, Feedback Agent, Infrastructure Agent, Leader Agent, Proposal Agent, QA Agent (Build), QA Agent (Email) (+5 more)

### Community 45 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, dev:client, dev:server, preview, seed

### Community 46 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, dotenv, express, react, react-dom, react-icons, recharts, styled-components (+31 more)

### Community 47 - "seed-demo.js"
Cohesion: 0.18
Nodes (10): CHANNELS, client, events, KEY, LEADS, now, pick(), rng (+2 more)

### Community 48 - "notion-upload-document.mjs"
Cohesion: 0.29
Nodes (11): api(), arg(), __dirname, H, main(), resolveClientId(), root, sleep() (+3 more)

### Community 49 - "bloomline-dashboard/src/components/ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 50 - "launchops-portal/src/App.tsx"
Cohesion: 0.27
Nodes (7): client, login(), logout(), UnauthorizedError, App(), Layout, Main

### Community 51 - "launchops-portal/src/theme.ts"
Cohesion: 0.13
Nodes (13): DateBox, Eyebrow, Head, Sub, Title, GlobalStyles, ASSET_TYPES, PHASES (+5 more)

### Community 52 - "pipeline-dashboard/src/components/ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 54 - "label-notion-databases.mjs"
Cohesion: 0.18
Nodes (8): __dirname, H, keepDb, keepDs, results, root, store, token

### Community 55 - "Changelog"
Cohesion: 0.14
Nodes (13): [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02), [0.1.4](https://github.com/supabase/agent-skills/compare/v0.1.3...v0.1.4) (2026-06-05), [0.1.5](https://github.com/supabase/agent-skills/compare/v0.1.4...v0.1.5) (2026-07-10), [0.1.6](https://github.com/supabase/agent-skills/compare/v0.1.5...supabase-v0.1.6) (2026-07-30), Bug Fixes, Bug Fixes, Bug Fixes, Bug Fixes (+5 more)

### Community 56 - "pipeline-dashboard/src/components/charts/ConversionDonut.tsx"
Cohesion: 0.22
Nodes (9): ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot, LegendRow (+1 more)

### Community 57 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, dotenv, express, react, react-dom, react-icons, recharts, styled-components (+9 more)

### Community 58 - "QA Categories"
Cohesion: 0.17
Nodes (11): Accessibility, Best Practices, Content, Cross-Platform, Design QA Checklist, Interaction, Layout, QA Categories (+3 more)

### Community 59 - "bloomline-dashboard/src/components/charts/WeeklyTrend.tsx"
Cohesion: 0.20
Nodes (10): App(), ChartWrap, WeeklyTrend(), WeeklyTrendProps, DefaultTheme, styled-components, GlobalStyles, Theme (+2 more)

### Community 60 - "bloomline-dashboard/src/components/Header.tsx"
Cohesion: 0.16
Nodes (12): Badge, DevModeBadge(), Bar, BellButton, DateLabel, Header(), Right, Subtitle (+4 more)

### Community 61 - "notion-fix-schema.js"
Cohesion: 0.22
Nodes (6): __dirname, H, root, SCHEMAS, store, token

### Community 62 - "set-vercel-env.mjs"
Cohesion: 0.22
Nodes (6): auth, __dirname, envFile, envId, root, values

### Community 63 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, dotenv, express, react, react-dom, react-icons, recharts, styled-components (+33 more)

### Community 64 - "Process"
Cohesion: 0.17
Nodes (11): Error Handling, Example Usage, Execution Summary Template, Parallel Task Executor, Process, Step 1: Parse Request, Step 2: Read & Parse Plan, Step 3: Launch Subagents (+3 more)

### Community 65 - "Bloomline Apparel Text AI Agent"
Cohesion: 0.29
Nodes (7): Bloomline Apparel Text AI Agent, Discovery Call: Bloomline Apparel, Supabase Data Model, Dashboard Build Playbook, GoHighLevel, n8n, Shopify

### Community 67 - "launchops-portal/vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 68 - "Invoice Template Skill"
Cohesion: 0.18
Nodes (10): Best Practices, Domain Knowledge, How to Use, HTML Template Approach, Installation, Invoice Data Structure, Invoice Template Skill, Overview (+2 more)

### Community 69 - "Icon Library"
Cohesion: 0.29
Nodes (7): Icon Library, Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Icon, X (Twitter) Icon

### Community 71 - "pipeline-dashboard/vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 73 - "pipeline-dashboard/src/components/TimeframeToggle.tsx"
Cohesion: 0.33
Nodes (5): Option, TIMEFRAME_OPTIONS, TimeframeToggle(), TimeframeToggleProps, Toggle

### Community 74 - "inventory-notion-pages.mjs"
Cohesion: 0.33
Nodes (4): H, pages, root, token

### Community 75 - "send_email.py"
Cohesion: 0.60
Nodes (5): load_env(), main(), refresh_access_token(), save_token(), send()

### Community 76 - "Bloomline Document Build Plan"
Cohesion: 0.40
Nodes (5): Bloomline Document Build Plan, Bloomline Contract PDF, Invoice Template, Proposal Template, Receipt Template

### Community 77 - "bloomline-dashboard/src/components/charts/ConversionDonut.tsx"
Cohesion: 0.22
Nodes (9): ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot, LegendRow (+1 more)

### Community 78 - "Process"
Cohesion: 0.25
Nodes (7): 1. Pin the fixed point, 2. Identify the spec source, 3. Identify the standards sources, 4. Spawn both sub-agents in parallel, 5. Aggregate, Process, Why two axes

### Community 79 - "Frontend Design"
Cohesion: 0.29
Nodes (6): Design principles, Frontend Design, Ground it in the subject, More on writing in design, Process: brainstorm, explore, plan, critique, build, critique again, Restraint and self-critique

### Community 80 - "feedback-issue-template.md"
Cohesion: 0.29
Nodes (5): Fix suggestion, Source, What happened, Skill Feedback, Steps

### Community 82 - "Pipeline — Agent Report Dashboard"
Cohesion: 0.29
Nodes (6): Deploy to Vercel, n8n → dashboard (ConversionOS), Pipeline — Agent Report Dashboard, Run locally, Supabase, Webhooks

### Community 83 - "bloomline-dashboard/src/components/TimeframeToggle.tsx"
Cohesion: 0.33
Nodes (5): Option, TIMEFRAME_OPTIONS, TimeframeToggle(), TimeframeToggleProps, Toggle

### Community 84 - "wrap"
Cohesion: 0.67
Nodes (3): main(), Word-wrap text to max_w points; returns list of lines. A literal "\n" inside…, wrap()

### Community 85 - "extract_form_structure.py"
Cohesion: 0.67
Nodes (3): extract_form_structure(), main(), Extract form structure from a non-fillable PDF. This script analyzes the PDF to…

### Community 87 - "bloomline-dashboard/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 89 - "Performance Log — Email Agent"
Cohesion: 0.40
Nodes (4): 2026-08-04 — Test email: "$10k/mo" (client: none), Entries, Performance Log — Email Agent, Standards (always do)

### Community 93 - "Performance Log — Builder Agent"
Cohesion: 0.40
Nodes (4): 2026-08-20 — LaunchOps portal (Notion-backed ops hub), Entries, Performance Log — Builder Agent, Standards (always do)

### Community 122 - "Performance Log — Infrastructure Agent"
Cohesion: 0.50
Nodes (3): Entries, Performance Log — Infrastructure Agent, Standards (always do)

### Community 123 - "Performance Store"
Cohesion: 0.50
Nodes (3): How it works, Performance Store, Rules

## Knowledge Gaps
- **831 isolated node(s):** `Standards (always do)`, `2026-08-20 — LaunchOps portal (Notion-backed ops hub)`, `FetchState`, `Asset`, `Tone` (+826 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ApiError` connect `pipeline-dashboard/src/api/client.ts` to `pipeline-dashboard/src/tabs/BookingsTab.tsx`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `theme` connect `launchops-portal/src/theme.ts` to `Documents.tsx`, `LoginScreen.tsx`, `ProjectDetail.tsx`, `launchops-portal/src/components/ui.tsx`, `Overview.tsx`, `launchops-portal/src/components/Sidebar.tsx`, `Testimonials.tsx`, `Projects.tsx`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `@types/react-dom`, `eslint-plugin-react-refresh`, `bloomline-dashboard/package.json`, `eslint`, `vite`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `Standards (always do)`, `2026-08-20 — LaunchOps portal (Notion-backed ops hub)`, `FetchState` to the rest of the system?**
  _831 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bloomline-dashboard/server/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062409288824383166 - nodes in this community are weakly interconnected._
- **Should `notion.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09468599033816426 - nodes in this community are weakly interconnected._
- **Should `pipeline-dashboard/server/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05875706214689266 - nodes in this community are weakly interconnected._