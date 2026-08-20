# Graph Report - onboarding-agent  (2026-08-20)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1420 nodes · 2368 edges · 122 communities (95 shown, 27 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.83)
- Token cost: 4,305 input · 1,182 output

## Community Hubs (Navigation)
- Server Data Adapters
- Auth and API Server
- Local File Storage
- Dashboard UI Components
- Proposal PDF Generator
- API Client and Hooks
- Contract PDF Generator
- Chart and Toggle Components
- Project Detail View
- Notion API Integration
- Portal UI Components
- Overview Dashboard View
- Data Fetching Hooks
- Sidebar Navigation
- Calendar and Month Navigation
- Header and Testimonials
- Agent Configuration
- KPI Dashboard Tab
- Status and Badge Components
- Trend Chart Components
- KPI Card Components
- KPI Calculation Logic
- Calendar Tab View
- Dashboard Sidebar
- Settings and Error States
- TypeScript Compiler Config
- TypeScript Library Config
- TypeScript JSX Config
- TypeScript Module Config
- TypeScript Strict Config
- TypeScript Base Config
- Project List Components
- Settings Form Components
- Pipeline Sidebar
- Linting and Dev Tools
- Document Management View
- Header and Dev Badges
- Notion Seeding Scripts
- AI Agent Orchestration
- Login Screen UI
- App Layout and Tabs
- Weekly Trend Charts
- KPI Change Tracking
- Receipt PDF Generator
- AI Agent System Prompts
- Dashboard Package Config
- Portal Package Config
- Demo Data Seeding
- Notion Document Upload
- Error Boundary Component
- Portal API Client
- Portal Theme and Styles
- Pipeline Error Boundary
- Booking Tab Navigation
- Notion Database Labeling
- TypeScript DOM Libs
- Conversion Donut Chart
- Core Web Dependencies
- Chart and Server Deps
- Dashboard Theme Setup
- Dashboard Header
- Notion Schema Fixes
- Vercel Environment Management
- Supabase Integration
- Vite Dev Dependencies
- Project Knowledge Base
- Vite and TS Configs
- Portal Vercel Config
- Project Scripts
- Social Icon Library
- Empty State Components
- Pipeline Vercel Config
- React DOM Types
- Timeframe Toggle Component
- Notion Page Inventory
- Email Automation Script
- Document Templates
- Pipeline Package Metadata
- Environment Variable Utility
- React DOM Library
- React Icons Library
- React Type Definitions
- TypeScript Language
- Vite React Plugin
- Invoice PDF Generator
- PDF Form Extraction
- Dashboard TS References
- Dashboard App TSConfig
- Portal TS References
- Portal App TSConfig
- PDF Bounding Boxes
- Graphify Plugin
- Pipeline TS References
- Pipeline App TSConfig
- Dashboard Assets
- Dashboard Documentation
- n8n Workflow Config
- Client Workspace Documentation
- Agent Performance Logs
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

## Communities (122 total, 27 thin omitted)

### Community 0 - "Server Data Adapters"
Cohesion: 0.06
Nodes (38): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+30 more)

### Community 1 - "Auth and API Server"
Cohesion: 0.09
Nodes (36): app, createApp(), issueToken(), loginRouter(), requireAuth(), secret(), sign(), verifyToken() (+28 more)

### Community 2 - "Local File Storage"
Cohesion: 0.07
Nodes (26): atomicWrite(), createLocalFileAdapter(), DATA_DIR, __dirname, DuplicateEmailError, ensureDataDir(), EVENTS_FILE, USERS_FILE (+18 more)

### Community 3 - "Dashboard UI Components"
Cohesion: 0.16
Nodes (32): Content, MainArea, ErrorState(), Badge, SampleDataBadge(), Card, CardHeader, CardSub (+24 more)

### Community 4 - "Proposal PDF Generator"
Cohesion: 0.09
Nodes (27): build_table(), bullets(), draw_chrome(), draw_cover(), esc(), h1(), h2(), NumberedCanvas (+19 more)

### Community 5 - "API Client and Hooks"
Cohesion: 0.13
Nodes (24): api, ApiError, CalendarGridProps, Badge, DevModeBadge(), FetchState, useFetch(), useHealth() (+16 more)

### Community 6 - "Contract PDF Generator"
Cohesion: 0.09
Nodes (28): build(), build_story(), draw_content_decor(), draw_cover(), main(), Main section heading + the template's dark-navy underline rule., Two-column acceptance block (CLIENT / LAUNCHOPS AI)., Remove ReportLab's unused Helvetica page-resource entry (no glyphs use it).… (+20 more)

### Community 7 - "Chart and Toggle Components"
Cohesion: 0.06
Nodes (34): ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot, LegendRow (+26 more)

### Community 8 - "Project Detail View"
Cohesion: 0.05
Nodes (35): AdvanceBtn, AssetContent, AssetIcon, AssetLink, AssetList, AssetName, AssetRow, AssetType (+27 more)

### Community 9 - "Notion API Integration"
Cohesion: 0.10
Nodes (29): api(), ASSET_TYPES, chk(), createDatabase(), date(), __dirname, DOC_STATUS, DOC_TYPES (+21 more)

### Community 10 - "Portal UI Components"
Cohesion: 0.09
Nodes (26): Avatar(), Badge, CardShell, Circle, Dot, Empty, EmptyState(), Fill (+18 more)

### Community 11 - "Overview Dashboard View"
Cohesion: 0.08
Nodes (26): ChartBox, FeedDate, FeedList, FeedRow, FeedTitle, Grid2, Hero, HeroLabel (+18 more)

### Community 12 - "Data Fetching Hooks"
Cohesion: 0.16
Nodes (20): api, ApiError, useCalendar(), FetchState, useFetch(), useKpis(), useSpeedTrend(), useTopLeads() (+12 more)

### Community 13 - "Sidebar Navigation"
Cohesion: 0.08
Nodes (24): ActiveBar, Aside, Brand, Footer, Idx, items, LogoMark, LogoutBtn (+16 more)

### Community 14 - "Calendar and Month Navigation"
Cohesion: 0.12
Nodes (19): BookingChip, BookingTime, CalendarGrid(), DayCell, DayHeader, DayNumber, Grid, WEEKDAYS (+11 more)

### Community 15 - "Header and Testimonials"
Cohesion: 0.10
Nodes (21): DateBox, Eyebrow, Head, Header(), Sub, Title, formatDate(), Feedback() (+13 more)

### Community 16 - "Agent Configuration"
Cohesion: 0.09
Nodes (23): command, enabled, type, default_agent, NOTION_API_TOKEN, instructions, mcp, canva (+15 more)

### Community 17 - "KPI Dashboard Tab"
Cohesion: 0.09
Nodes (22): DarkCard, DarkCardHeader, DarkSub, DarkTitle, handoverSubtitle(), KPI_META, KpiGrid, KpiRow (+14 more)

### Community 18 - "Status and Badge Components"
Cohesion: 0.24
Nodes (17): Badge, SampleDataBadge(), Card, CardHeader, CardSub, CardTitle, channelColor(), ChannelPill() (+9 more)

### Community 19 - "Trend Chart Components"
Cohesion: 0.15
Nodes (15): App(), ChartWrap, formatHours(), SpeedTrendChart(), SpeedTrendChartProps, ChartWrap, WeeklyTrend(), WeeklyTrendProps (+7 more)

### Community 20 - "KPI Card Components"
Cohesion: 0.17
Nodes (13): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+5 more)

### Community 21 - "KPI Calculation Logic"
Cohesion: 0.24
Nodes (17): changeFor(), computeKpis(), countAll(), dailyBookingBuckets(), dailySpeedBuckets(), followUpSpeedHours(), KPI_DEFS, localDateKey() (+9 more)

### Community 22 - "Calendar Tab View"
Cohesion: 0.15
Nodes (15): BookingChip, BookingTime, CalendarGrid(), CalendarGridProps, DayCell, DayHeader, DayNumber, Grid (+7 more)

### Community 23 - "Dashboard Sidebar"
Cohesion: 0.11
Nodes (16): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+8 more)

### Community 24 - "Settings and Error States"
Cohesion: 0.12
Nodes (15): ErrorStateProps, Message, RetryButton, Wrapper, Pill, useUsers(), ErrorBox, Field (+7 more)

### Community 25 - "TypeScript Compiler Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 26 - "TypeScript Library Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 27 - "TypeScript JSX Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 28 - "TypeScript Module Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 29 - "TypeScript Strict Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 30 - "TypeScript Base Config"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 31 - "Project List Components"
Cohesion: 0.13
Nodes (15): Card(), daysUntil(), ProjectDetail(), Dates, Footer, GoBtn, LinkRow, Meta (+7 more)

### Community 32 - "Settings Form Components"
Cohesion: 0.13
Nodes (14): ErrorState(), ErrorStateProps, Message, RetryButton, Wrapper, Pill, ErrorBox, Field (+6 more)

### Community 33 - "Pipeline Sidebar"
Cohesion: 0.12
Nodes (14): Aside, Avatar, Brand, BrandName, BuiltBy, Company, Nav, NAV_ITEMS (+6 more)

### Community 34 - "Linting and Dev Tools"
Cohesion: 0.13
Nodes (15): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, typescript-eslint, vite (+7 more)

### Community 35 - "Document Management View"
Cohesion: 0.14
Nodes (14): Loading(), Client, DocName, Documents(), DownloadLink, Head, Notes, PaidLine (+6 more)

### Community 36 - "Header and Dev Badges"
Cohesion: 0.16
Nodes (12): Badge, DevModeBadge(), Bar, BellButton, DateLabel, Header(), Right, Subtitle (+4 more)

### Community 37 - "Notion Seeding Scripts"
Cohesion: 0.22
Nodes (13): api(), __dirname, facts, findProject(), HEADERS, queryAll(), relOf(), root (+5 more)

### Community 38 - "AI Agent Orchestration"
Cohesion: 0.14
Nodes (14): Builder Agent, Email Agent, Feedback Agent, Infrastructure Agent, Leader Agent (Orchestrator), Proposal Agent, QA Agent (Build), QA Agent (Email) (+6 more)

### Community 39 - "Login Screen UI"
Cohesion: 0.14
Nodes (13): Button, Error, Eyebrow, Foot, Form, Input, LoginScreen(), Logo (+5 more)

### Community 40 - "App Layout and Tabs"
Cohesion: 0.26
Nodes (13): Content, MainArea, Sidebar(), TabId, useEvents(), BookingsTab(), ConversationsTab(), FollowUpsTab() (+5 more)

### Community 41 - "Weekly Trend Charts"
Cohesion: 0.19
Nodes (11): ChartWrap, WeeklyTrend(), WeeklyTrendProps, EmptyState(), EmptyStateProps, Hint, Message, Title (+3 more)

### Community 42 - "KPI Change Tracking"
Cohesion: 0.21
Nodes (11): badgeText(), badgeTone(), Card, Dot, KpiCard(), KpiCardProps, Label, LabelRow (+3 more)

### Community 43 - "Receipt PDF Generator"
Cohesion: 0.15
Nodes (9): draw(), find(), protect(), Keep phone numbers and 'N days' phrases atomic so wrapping never splits them., # NOTE: template ARRIVE / DEPART travel fields omitted (no facts, N/A) -…, Return the exact must_appear token starting with `prefix`., Draw `text` at x with its glyph top at `top` (distance from page top)., Greedy word wrap by measured width; returns list of lines (no mid-word splits). (+1 more)

### Community 44 - "AI Agent System Prompts"
Cohesion: 0.21
Nodes (13): Builder Agent, Email Agent, Feedback Agent, Infrastructure Agent, Leader Agent, Proposal Agent, QA Agent (Build), QA Agent (Email) (+5 more)

### Community 45 - "Dashboard Package Config"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, dev:client, dev:server, preview (+3 more)

### Community 46 - "Portal Package Config"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, dev:client, dev:server, preview (+3 more)

### Community 47 - "Demo Data Seeding"
Cohesion: 0.18
Nodes (10): CHANNELS, client, events, KEY, LEADS, now, pick(), rng (+2 more)

### Community 48 - "Notion Document Upload"
Cohesion: 0.29
Nodes (11): api(), arg(), __dirname, H, main(), resolveClientId(), root, sleep() (+3 more)

### Community 49 - "Error Boundary Component"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 50 - "Portal API Client"
Cohesion: 0.27
Nodes (7): client, login(), logout(), UnauthorizedError, App(), Layout, Main

### Community 51 - "Portal Theme and Styles"
Cohesion: 0.22
Nodes (8): GlobalStyles, ASSET_TYPES, PHASES, phaseStatusColor, PROJECT_STATUSES, projectStatusColor, StatusColor, theme

### Community 52 - "Pipeline Error Boundary"
Cohesion: 0.18
Nodes (7): Detail, ErrorBoundary, Fallback, Props, ReloadButton, State, Title

### Community 53 - "Booking Tab Navigation"
Cohesion: 0.20
Nodes (9): ArrowButton, Label, MonthNav(), MonthNavProps, Nav, toCalendarBooking(), View, ViewButton (+1 more)

### Community 54 - "Notion Database Labeling"
Cohesion: 0.18
Nodes (8): __dirname, H, keepDb, keepDs, results, root, store, token

### Community 55 - "TypeScript DOM Libs"
Cohesion: 0.20
Nodes (10): lib, DOM, ES2020, lib, DOM, DOM.Iterable, lib, DOM (+2 more)

### Community 56 - "Conversion Donut Chart"
Cohesion: 0.22
Nodes (9): ChartWrap, ConversionDonut(), ConversionDonutProps, DonutSegment, Legend, LegendCount, LegendDot, LegendRow (+1 more)

### Community 57 - "Core Web Dependencies"
Cohesion: 0.22
Nodes (9): dependencies, express, react, styled-components, express, react, styled-components, styled-components (+1 more)

### Community 58 - "Chart and Server Deps"
Cohesion: 0.22
Nodes (9): recharts, dependencies, express, react, recharts, express, react, recharts (+1 more)

### Community 59 - "Dashboard Theme Setup"
Cohesion: 0.33
Nodes (5): App(), DefaultTheme, styled-components, GlobalStyles, Theme

### Community 60 - "Dashboard Header"
Cohesion: 0.22
Nodes (8): Bar, BellButton, DateLabel, Header(), Right, Subtitle, Title, Titles

### Community 61 - "Notion Schema Fixes"
Cohesion: 0.22
Nodes (6): __dirname, H, root, SCHEMAS, store, token

### Community 62 - "Vercel Environment Management"
Cohesion: 0.22
Nodes (6): auth, __dirname, envFile, envId, root, values

### Community 63 - "Supabase Integration"
Cohesion: 0.25
Nodes (8): @supabase/supabase-js, dependencies, express, react, @supabase/supabase-js, express, react, @supabase/supabase-js

### Community 64 - "Vite Dev Dependencies"
Cohesion: 0.25
Nodes (8): concurrently, devDependencies, concurrently, @types/react-dom, vite, concurrently, vite, concurrently

### Community 65 - "Project Knowledge Base"
Cohesion: 0.29
Nodes (7): Bloomline Apparel Text AI Agent, Discovery Call: Bloomline Apparel, Supabase Data Model, Dashboard Build Playbook, GoHighLevel, n8n, Shopify

### Community 66 - "Vite and TS Configs"
Cohesion: 0.29
Nodes (4): include, include, vite.config.ts, include

### Community 67 - "Portal Vercel Config"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 68 - "Project Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, dev:client, dev:server, preview, seed

### Community 69 - "Social Icon Library"
Cohesion: 0.29
Nodes (7): Icon Library, Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Icon, X (Twitter) Icon

### Community 70 - "Empty State Components"
Cohesion: 0.29
Nodes (6): EmptyState(), EmptyStateProps, Hint, Message, Title, Wrapper

### Community 71 - "Pipeline Vercel Config"
Cohesion: 0.29
Nodes (6): maxDuration, buildCommand, functions, api/index.js, outputDirectory, rewrites

### Community 72 - "React DOM Types"
Cohesion: 0.33
Nodes (6): @types/react-dom, @types/react-dom, devDependencies, @types/react-dom, vite, vite

### Community 73 - "Timeframe Toggle Component"
Cohesion: 0.33
Nodes (5): Option, TIMEFRAME_OPTIONS, TimeframeToggle(), TimeframeToggleProps, Toggle

### Community 74 - "Notion Page Inventory"
Cohesion: 0.33
Nodes (4): H, pages, root, token

### Community 75 - "Email Automation Script"
Cohesion: 0.60
Nodes (5): load_env(), main(), refresh_access_token(), save_token(), send()

### Community 76 - "Document Templates"
Cohesion: 0.40
Nodes (5): Bloomline Document Build Plan, Bloomline Contract PDF, Invoice Template, Proposal Template, Receipt Template

### Community 77 - "Pipeline Package Metadata"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 78 - "Environment Variable Utility"
Cohesion: 0.50
Nodes (4): dotenv, dotenv, dotenv, dotenv

### Community 79 - "React DOM Library"
Cohesion: 0.50
Nodes (4): react-dom, react-dom, react-dom, react-dom

### Community 80 - "React Icons Library"
Cohesion: 0.50
Nodes (4): react-icons, react-icons, react-icons, react-icons

### Community 81 - "React Type Definitions"
Cohesion: 0.50
Nodes (4): @types/react, @types/react, @types/react, @types/react

### Community 82 - "TypeScript Language"
Cohesion: 0.50
Nodes (4): typescript, typescript, typescript, typescript

### Community 83 - "Vite React Plugin"
Cohesion: 0.50
Nodes (4): @vitejs/plugin-react, @vitejs/plugin-react, @vitejs/plugin-react, @vitejs/plugin-react

### Community 84 - "Invoice PDF Generator"
Cohesion: 0.67
Nodes (3): main(), Word-wrap text to max_w points; returns list of lines. A literal "\n" inside…, wrap()

### Community 85 - "PDF Form Extraction"
Cohesion: 0.67
Nodes (3): extract_form_structure(), main(), Extract form structure from a non-fillable PDF. This script analyzes the PDF to…

## Knowledge Gaps
- **669 isolated node(s):** `FetchState`, `Asset`, `MonthNavProps`, `Tone`, `ChangeLabel` (+664 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Core Web Dependencies` to `Dashboard Package Config`, `Environment Variable Utility`, `React DOM Library`, `React Icons Library`, `Chart and Server Deps`, `Supabase Integration`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `React DOM Types` to `Vite Dev Dependencies`, `Pipeline Package Metadata`, `React Type Definitions`, `TypeScript Language`, `Vite React Plugin`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Linting and Dev Tools` to `Vite Dev Dependencies`, `React DOM Types`, `Dashboard Package Config`, `React Type Definitions`, `TypeScript Language`, `Vite React Plugin`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `FetchState`, `Asset`, `MonthNavProps` to the rest of the system?**
  _669 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server Data Adapters` be split into smaller, more focused modules?**
  _Cohesion score 0.062409288824383166 - nodes in this community are weakly interconnected._
- **Should `Auth and API Server` be split into smaller, more focused modules?**
  _Cohesion score 0.09468599033816426 - nodes in this community are weakly interconnected._
- **Should `Local File Storage` be split into smaller, more focused modules?**
  _Cohesion score 0.07439024390243902 - nodes in this community are weakly interconnected._