# Graph Report - onboarding-agent  (2026-09-17)

## Corpus Check
- 275 files · ~423,941 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1957 nodes · 2935 edges · 144 communities (113 shown, 31 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4367a62f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- bloomline-dashboard/server/index.js
- launchops-portal/server/notion.js
- pipeline-dashboard/server/app.js
- bloomline-dashboard/src/tabs/BookingsTab.tsx
- bloomline-apparel/build_proposal.py
- bloomline-dashboard/src/types/events.ts
- bloomline-apparel/build_contract.py
- bloomline-dashboard/src/tabs/DashboardTab.tsx
- ProjectDetail.tsx
- onboarding-site/server/notion.js
- Projects.tsx
- Overview.tsx
- pipeline-dashboard/src/types/events.ts
- launchops-portal/src/components/Sidebar.tsx
- PDF Processing Advanced Reference
- Testimonials.tsx
- opencode.json
- pipeline-dashboard/src/tabs/DashboardTab.tsx
- pipeline-dashboard/src/tabs/BookingsTab.tsx
- pipeline-dashboard/src/components/EmptyState.tsx
- pipeline-dashboard/src/components/KpiCard.tsx
- Proposal Writer
- bloomline-dashboard/src/tabs/CalendarTab.tsx
- bloomline-dashboard/src/components/Sidebar.tsx
- onboarding-site/package.json
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- compilerOptions
- Feedback.tsx
- leadflow/build_proposal.py
- pipeline-dashboard/src/components/Sidebar.tsx
- devDependencies
- Documents.tsx
- pipeline-dashboard/src/components/Header.tsx
- onboarding-site/src/App.tsx
- Leader Agent (Orchestrator)
- LoginScreen.tsx
- bloomline-dashboard/src/App.tsx
- Non-fillable fields
- bloomline-dashboard/src/components/KpiCard.tsx
- build_receipt.py
- Leader Agent
- scripts
- dependencies
- seed-demo.js
- pipeline-dashboard/src/App.tsx
- bloomline-dashboard/src/components/ErrorBoundary.tsx
- launchops-portal/src/App.tsx
- launchops-portal/src/theme.ts
- pipeline-dashboard/src/components/ErrorBoundary.tsx
- leadflow/build_receipt.py
- Changelog
- compilerOptions
- dependencies
- QA Categories
- bloomline-dashboard/src/components/EmptyState.tsx
- bloomline-dashboard/src/components/Header.tsx
- .opencode/opencode.json
- compilerOptions
- dependencies
- Process
- Bloomline Apparel Text AI Agent
- wrap
- launchops-portal/vercel.json
- Invoice Template Skill
- Icon Library
- LeadFlow.io — Discovery Call Transcript
- pipeline-dashboard/vercel.json
- @types/react-dom
- leadflow/build_contract.py
- modal_proposal_agent.py
- onboarding-site/add-notion-token-vercel.mjs
- Bloomline Document Build Plan
- eslint
- Process
- Frontend Design
- feedback-issue-template.md
- migrations.sql
- Pipeline — Agent Report Dashboard
- redeploy-onboarding-prod.mjs
- wrap
- extract_form_structure.py
- bloomline-dashboard/tsconfig.json
- bloomline-dashboard/package.json
- launchops-portal/tsconfig.json
- Performance Log — Email Agent
- check_bounding_boxes.py
- graphify.js
- pipeline-dashboard/tsconfig.json
- Entries
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
- launchops-portal/check-portal-password-env.mjs
- vite
- diagnose-portal-login.mjs
- onboarding-site/vercel.json
- patch-portal-password-on-vercel.mjs
- onboarding-site/tsconfig.json
- sync-portal-password-to-vercel.mjs
- check-portal-password-env.mjs
- add-notion-token-vercel.mjs
- redeploy-portal-prod.mjs
- set-portal-password-on-vercel.mjs
- check-portal-login.mjs
- pipeline-dashboard/src/components/MonthNav.tsx
- cleanup-portal-store.mjs
- debug-portal-store.mjs
- find-junk.mjs
- verify_document.py
- eslint-plugin-react-refresh

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 19 edges
2. `compilerOptions` - 18 edges
3. `compilerOptions` - 18 edges
4. `compilerOptions` - 18 edges
5. `useFetch()` - 17 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `compilerOptions` - 16 edges
9. `compilerOptions` - 16 edges
10. `formatDate()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Bloomline Document Build Plan` --references--> `Invoice Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Invoice Template.pdf
- `Bloomline Document Build Plan` --references--> `Proposal Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Proposal Template.pdf
- `Bloomline Document Build Plan` --references--> `Receipt Template`  [EXTRACTED]
  clients/bloomline-apparel/bloomline-docs-plan.md → .opencode/Template/Receipt Template.pdf
- `n8n Dashboard Nodes Config` --conceptually_related_to--> `ConversionOS n8n Workflow`  [EXTRACTED]
  dashboard-nodes-to-add.txt → N8N_WORKFLOW.png
- `Dashboard Build Playbook` --conceptually_related_to--> `n8n`  [INFERRED]
  docs/playbooks/client-dashboard-build.md → clients/bloomline-apparel/transcripts/discovery-call-2026-08-05.md

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

## Communities (144 total, 31 thin omitted)

### Community 0 - "bloomline-dashboard/server/index.js"
Cohesion: 0.06
Nodes (38): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+30 more)

### Community 1 - "launchops-portal/server/notion.js"
Cohesion: 0.05
Nodes (55): app, __dirname, env, envFile, H, prj, root, __dirname (+47 more)

### Community 2 - "pipeline-dashboard/server/app.js"
Cohesion: 0.06
Nodes (43): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+35 more)

### Community 3 - "bloomline-dashboard/src/tabs/BookingsTab.tsx"
Cohesion: 0.12
Nodes (35): EmptyState(), ErrorState(), ErrorStateProps, Message, RetryButton, Wrapper, Badge, SampleDataBadge() (+27 more)

### Community 4 - "bloomline-apparel/build_proposal.py"
Cohesion: 0.18
Nodes (13): build_table(), bullets(), draw_chrome(), draw_cover(), esc(), h1(), h2(), NumberedCanvas (+5 more)

### Community 5 - "bloomline-dashboard/src/types/events.ts"
Cohesion: 0.15
Nodes (21): api, ApiError, FetchState, useFetch(), useKpis(), useTopLeads(), useTrend(), useUsers() (+13 more)

### Community 6 - "bloomline-apparel/build_contract.py"
Cohesion: 0.17
Nodes (14): build(), build_story(), draw_content_decor(), draw_cover(), main(), Flowable, Main section heading + the template's dark-navy underline rule., Two-column acceptance block (CLIENT / LAUNCHOPS AI). (+6 more)

### Community 7 - "bloomline-dashboard/src/tabs/DashboardTab.tsx"
Cohesion: 0.06
Nodes (35): ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot, LegendRow (+27 more)

### Community 8 - "ProjectDetail.tsx"
Cohesion: 0.04
Nodes (51): AdvanceBtn, AssetContent, AssetIcon, AssetLink, AssetList, AssetName, AssetRow, AssetType (+43 more)

### Community 9 - "onboarding-site/server/notion.js"
Cohesion: 0.07
Nodes (49): app, createApp(), __dirname, resolveConfig(), app, cfg, api(), chk() (+41 more)

### Community 10 - "Projects.tsx"
Cohesion: 0.09
Nodes (28): Avatar(), Badge, Card(), CardShell, Circle, Dot, Empty, EmptyState() (+20 more)

### Community 11 - "Overview.tsx"
Cohesion: 0.08
Nodes (27): daysUntil(), ChartBox, FeedDate, FeedList, FeedRow, FeedTitle, Grid2, Hero (+19 more)

### Community 12 - "pipeline-dashboard/src/types/events.ts"
Cohesion: 0.17
Nodes (18): api, ApiError, FetchState, useFetch(), useUsers(), Change, ChangeLabel, CalendarBooking (+10 more)

### Community 13 - "launchops-portal/src/components/Sidebar.tsx"
Cohesion: 0.08
Nodes (24): ActiveBar, Aside, Brand, Footer, Idx, items, LogoMark, LogoutBtn (+16 more)

### Community 14 - "PDF Processing Advanced Reference"
Cohesion: 0.04
Nodes (46): 1. For Large PDFs, 2. For Text Extraction, 3. For Image Extraction, 4. For Form Filling, 5. Memory Management, Advanced Command-Line Operations, Advanced Encryption, Advanced Image Conversion (+38 more)

### Community 15 - "Testimonials.tsx"
Cohesion: 0.09
Nodes (23): DateBox, Eyebrow, Head, Header(), Sub, Title, formatDate(), StarRating() (+15 more)

### Community 16 - "opencode.json"
Cohesion: 0.09
Nodes (23): command, enabled, type, default_agent, NOTION_API_TOKEN, instructions, mcp, canva (+15 more)

### Community 17 - "pipeline-dashboard/src/tabs/DashboardTab.tsx"
Cohesion: 0.07
Nodes (34): Option, TIMEFRAME_OPTIONS, TimeframeToggle(), TimeframeToggleProps, Toggle, useKpis(), useSpeedTrend(), useTopLeads() (+26 more)

### Community 18 - "pipeline-dashboard/src/tabs/BookingsTab.tsx"
Cohesion: 0.12
Nodes (35): EmptyState(), ErrorState(), ErrorStateProps, Message, RetryButton, Wrapper, Badge, SampleDataBadge() (+27 more)

### Community 19 - "pipeline-dashboard/src/components/EmptyState.tsx"
Cohesion: 0.08
Nodes (27): App(), ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot (+19 more)

### Community 20 - "pipeline-dashboard/src/components/KpiCard.tsx"
Cohesion: 0.22
Nodes (10): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+2 more)

### Community 21 - "Proposal Writer"
Cohesion: 0.09
Nodes (22): Call to Action, Customization Options, Example: SaaS Implementation Proposal, Examples, Executive Summary, Executive Summary, How to Use, HR Software Implementation Proposal (+14 more)

### Community 22 - "bloomline-dashboard/src/tabs/CalendarTab.tsx"
Cohesion: 0.11
Nodes (22): BookingChip, BookingTime, CalendarGrid(), CalendarGridProps, DayCell, DayHeader, DayNumber, Grid (+14 more)

### Community 23 - "bloomline-dashboard/src/components/Sidebar.tsx"
Cohesion: 0.11
Nodes (16): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+8 more)

### Community 24 - "onboarding-site/package.json"
Cohesion: 0.06
Nodes (35): dependencies, dotenv, express, react, react-dom, react-icons, devDependencies, concurrently (+27 more)

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

### Community 31 - "Feedback.tsx"
Cohesion: 0.13
Nodes (14): Loading(), BizName, Count, FBadges, FilterBtn, FILTERS, FMain, FSub (+6 more)

### Community 32 - "leadflow/build_proposal.py"
Cohesion: 0.18
Nodes (13): build_table(), bullets(), draw_chrome(), draw_cover(), esc(), h1(), h2(), NumberedCanvas (+5 more)

### Community 33 - "pipeline-dashboard/src/components/Sidebar.tsx"
Cohesion: 0.11
Nodes (16): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+8 more)

### Community 34 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, concurrently, @eslint/js, eslint-plugin-react-hooks, globals, @types/react, typescript, typescript-eslint (+9 more)

### Community 35 - "Documents.tsx"
Cohesion: 0.14
Nodes (14): StatusBadge(), Client, DocName, Documents(), DownloadLink, Head, Notes, PaidLine (+6 more)

### Community 36 - "pipeline-dashboard/src/components/Header.tsx"
Cohesion: 0.18
Nodes (11): Badge, DevModeBadge(), Bar, BellButton, DateLabel, Header(), Right, Subtitle (+3 more)

### Community 37 - "onboarding-site/src/App.tsx"
Cohesion: 0.07
Nodes (41): App(), ErrorBanner(), Props, Logo(), Props, Stepper(), STEPS, AGENT_ROWS (+33 more)

### Community 38 - "Leader Agent (Orchestrator)"
Cohesion: 0.14
Nodes (14): Builder Agent, Email Agent, Feedback Agent, Infrastructure Agent, Leader Agent (Orchestrator), Proposal Agent, QA Agent (Build), QA Agent (Email) (+6 more)

### Community 39 - "LoginScreen.tsx"
Cohesion: 0.14
Nodes (13): Button, Error, Eyebrow, Foot, Form, Input, LoginScreen(), Logo (+5 more)

### Community 40 - "bloomline-dashboard/src/App.tsx"
Cohesion: 0.29
Nodes (12): Content, MainArea, useEvents(), BookingsTab(), toCalendarBooking(), ConversationsTab(), FollowUpsTab(), HumanTransfersTab() (+4 more)

### Community 41 - "Non-fillable fields"
Cohesion: 0.11
Nodes (18): A.1: Analyze the Structure, A.2: Check for Missing Elements, A.3: Create fields.json with PDF Coordinates, A.4: Validate Bounding Boxes, Approach A: Structure-Based Coordinates (Preferred), Approach B: Visual Estimation (Fallback), B.1: Convert PDF to Images, B.2: Initial Field Identification (+10 more)

### Community 42 - "bloomline-dashboard/src/components/KpiCard.tsx"
Cohesion: 0.24
Nodes (9): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+1 more)

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

### Community 48 - "pipeline-dashboard/src/App.tsx"
Cohesion: 0.12
Nodes (28): Content, MainArea, BookingChip, BookingTime, CalendarGrid(), CalendarGridProps, DayCell, DayHeader (+20 more)

### Community 49 - "bloomline-dashboard/src/components/ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 50 - "launchops-portal/src/App.tsx"
Cohesion: 0.27
Nodes (7): client, login(), logout(), UnauthorizedError, App(), Layout, Main

### Community 51 - "launchops-portal/src/theme.ts"
Cohesion: 0.22
Nodes (8): GlobalStyles, ASSET_TYPES, PHASES, phaseStatusColor, PROJECT_STATUSES, projectStatusColor, StatusColor, theme

### Community 52 - "pipeline-dashboard/src/components/ErrorBoundary.tsx"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 53 - "leadflow/build_receipt.py"
Cohesion: 0.15
Nodes (9): draw(), find(), protect(), Keep phone numbers and 'N days' phrases atomic so wrapping never splits them., # NOTE: template ARRIVE / DEPART travel fields omitted (no facts, N/A) -…, Return the exact must_appear token starting with `prefix`., Draw `text` at x with its glyph top at `top` (distance from page top)., Greedy word wrap by measured width; returns list of lines (no mid-word splits). (+1 more)

### Community 55 - "Changelog"
Cohesion: 0.14
Nodes (13): [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02), [0.1.4](https://github.com/supabase/agent-skills/compare/v0.1.3...v0.1.4) (2026-06-05), [0.1.5](https://github.com/supabase/agent-skills/compare/v0.1.4...v0.1.5) (2026-07-10), [0.1.6](https://github.com/supabase/agent-skills/compare/v0.1.5...supabase-v0.1.6) (2026-07-30), Bug Fixes, Bug Fixes, Bug Fixes, Bug Fixes (+5 more)

### Community 56 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+16 more)

### Community 57 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, dotenv, express, react, react-dom, react-icons, recharts, styled-components (+9 more)

### Community 58 - "QA Categories"
Cohesion: 0.17
Nodes (11): Accessibility, Best Practices, Content, Cross-Platform, Design QA Checklist, Interaction, Layout, QA Categories (+3 more)

### Community 59 - "bloomline-dashboard/src/components/EmptyState.tsx"
Cohesion: 0.13
Nodes (14): App(), ChartWrap, WeeklyTrend(), WeeklyTrendProps, EmptyStateProps, Hint, Message, Title (+6 more)

### Community 60 - "bloomline-dashboard/src/components/Header.tsx"
Cohesion: 0.18
Nodes (11): Badge, DevModeBadge(), Bar, BellButton, DateLabel, Header(), Right, Subtitle (+3 more)

### Community 61 - ".opencode/opencode.json"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 62 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 63 - "dependencies"
Cohesion: 0.05
Nodes (41): dependencies, dotenv, express, react, react-dom, react-icons, recharts, styled-components (+33 more)

### Community 64 - "Process"
Cohesion: 0.17
Nodes (11): Error Handling, Example Usage, Execution Summary Template, Parallel Task Executor, Process, Step 1: Parse Request, Step 2: Read & Parse Plan, Step 3: Launch Subagents (+3 more)

### Community 65 - "Bloomline Apparel Text AI Agent"
Cohesion: 0.29
Nodes (7): Bloomline Apparel Text AI Agent, Discovery Call: Bloomline Apparel, Supabase Data Model, Dashboard Build Playbook, GoHighLevel, n8n, Shopify

### Community 66 - "wrap"
Cohesion: 0.67
Nodes (3): main(), Word-wrap text to max_w points; returns list of lines. A literal "\n" inside…, wrap()

### Community 67 - "launchops-portal/vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 68 - "Invoice Template Skill"
Cohesion: 0.18
Nodes (10): Best Practices, Domain Knowledge, How to Use, HTML Template Approach, Installation, Invoice Data Structure, Invoice Template Skill, Overview (+2 more)

### Community 69 - "Icon Library"
Cohesion: 0.29
Nodes (7): Icon Library, Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Icon, X (Twitter) Icon

### Community 70 - "LeadFlow.io — Discovery Call Transcript"
Cohesion: 0.50
Nodes (3): Extracted facts (from call), LeadFlow.io — Discovery Call Transcript, Open items noted from call

### Community 71 - "pipeline-dashboard/vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 73 - "leadflow/build_contract.py"
Cohesion: 0.10
Nodes (24): build(), build_story(), draw_content_decor(), draw_cover(), main(), Flowable, Main section heading + the template's dark-navy underline rule., Two-column acceptance block (CLIENT / LAUNCHOPS AI). (+16 more)

### Community 74 - "modal_proposal_agent.py"
Cohesion: 0.38
Nodes (6): function, local_entrypoint, generate_client_proposal_pdf(), main(), register_fonts(), remote_generate_proposal()

### Community 75 - "onboarding-site/add-notion-token-vercel.mjs"
Cohesion: 0.29
Nodes (4): __dirname, env, H, root

### Community 76 - "Bloomline Document Build Plan"
Cohesion: 0.40
Nodes (5): Bloomline Document Build Plan, Bloomline Contract PDF, Invoice Template, Proposal Template, Receipt Template

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

### Community 83 - "redeploy-onboarding-prod.mjs"
Cohesion: 0.29
Nodes (4): __dirname, env, H, root

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

### Community 93 - "Entries"
Cohesion: 0.33
Nodes (5): 2026-08-20 — LaunchOps portal (Notion-backed ops hub), 2026-09-16 — LaunchOps onboarding website build (stages: Infra spec → QA → Builder S1-S11 → Build QA conditional PASS), Entries, Performance Log — Builder Agent, Standards (always do)

### Community 122 - "Performance Log — Infrastructure Agent"
Cohesion: 0.40
Nodes (4): 2026-09-16 — LaunchOps onboarding website spec (Infra spec → QA → Builder S1-S11, Build QA conditional PASS), Entries, Performance Log — Infrastructure Agent, Standards (always do)

### Community 123 - "Performance Store"
Cohesion: 0.50
Nodes (3): How it works, Performance Store, Rules

### Community 124 - "launchops-portal/check-portal-password-env.mjs"
Cohesion: 0.17
Nodes (8): __dirname, DO_FIX, env, envFile, envTxt, H, prj, root

### Community 127 - "diagnose-portal-login.mjs"
Cohesion: 0.20
Nodes (6): __dirname, env, envTxt, H, prj, root

### Community 128 - "onboarding-site/vercel.json"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 129 - "patch-portal-password-on-vercel.mjs"
Cohesion: 0.20
Nodes (6): __dirname, env, envTxt, H, prj, root

### Community 131 - "sync-portal-password-to-vercel.mjs"
Cohesion: 0.22
Nodes (5): __dirname, env, envTxt, prjJson, root

### Community 133 - "check-portal-password-env.mjs"
Cohesion: 0.25
Nodes (5): __dirname, env, H, prj, root

### Community 134 - "add-notion-token-vercel.mjs"
Cohesion: 0.25
Nodes (5): __dirname, env, H, prj, root

### Community 135 - "redeploy-portal-prod.mjs"
Cohesion: 0.25
Nodes (5): __dirname, env, H, prj, root

### Community 136 - "set-portal-password-on-vercel.mjs"
Cohesion: 0.25
Nodes (5): A, __dirname, env, prj, root

### Community 137 - "check-portal-login.mjs"
Cohesion: 0.29
Nodes (5): __dirname, env, H, prj, root

### Community 138 - "pipeline-dashboard/src/components/MonthNav.tsx"
Cohesion: 0.33
Nodes (5): ArrowButton, Label, MonthNav(), MonthNavProps, Nav

### Community 140 - "cleanup-portal-store.mjs"
Cohesion: 0.25
Nodes (6): api(), __dirname, env, queryAll(), root, SHOULD_ARCHIVE

### Community 141 - "debug-portal-store.mjs"
Cohesion: 0.25
Nodes (7): api(), auth, __dirname, env, queryAll(), root, store

### Community 142 - "find-junk.mjs"
Cohesion: 0.25
Nodes (6): api(), __dirname, env, queryAll(), root, store

## Knowledge Gaps
- **984 isolated node(s):** `__dirname`, `root`, `FEEDBACK_PROPS`, `Dot`, `Track` (+979 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `theme` connect `launchops-portal/src/theme.ts` to `Documents.tsx`, `LoginScreen.tsx`, `ProjectDetail.tsx`, `Projects.tsx`, `Overview.tsx`, `launchops-portal/src/components/Sidebar.tsx`, `Testimonials.tsx`, `Feedback.tsx`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `strip_unused_helvetica()` connect `bloomline-apparel/build_contract.py` to `leadflow/build_contract.py`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `__dirname`, `root`, `FEEDBACK_PROPS` to the rest of the system?**
  _984 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bloomline-dashboard/server/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062409288824383166 - nodes in this community are weakly interconnected._
- **Should `launchops-portal/server/notion.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05328218243819267 - nodes in this community are weakly interconnected._
- **Should `pipeline-dashboard/server/app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05875706214689266 - nodes in this community are weakly interconnected._
- **Should `bloomline-dashboard/src/tabs/BookingsTab.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12292358803986711 - nodes in this community are weakly interconnected._