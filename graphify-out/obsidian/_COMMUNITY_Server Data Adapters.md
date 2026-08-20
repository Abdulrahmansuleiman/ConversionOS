---
type: community
cohesion: 0.06
members: 53
---

# Server Data Adapters

**Cohesion:** 0.06 - loosely connected
**Members:** 53 nodes

## Members
- [[dot-constructor()]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[dot-constructor()_1]] - code - bloomline-dashboard/server/adapters/supabase.js
- [[DATA_DIR]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[DuplicateEmailError]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[DuplicateEmailError_1]] - code - bloomline-dashboard/server/adapters/supabase.js
- [[EVENTS_FILE]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[GHL_WEBHOOK_SECRET]] - code - bloomline-dashboard/server/config.js
- [[KPI_DEFS]] - code - bloomline-dashboard/server/kpis.js
- [[LEADS]] - code - bloomline-dashboard/server/seed-sample.js
- [[PLAN]] - code - bloomline-dashboard/server/seed-sample.js
- [[SUPABASE_SERVICE_ROLE_KEY]] - code - bloomline-dashboard/server/config.js
- [[SUPABASE_URL]] - code - bloomline-dashboard/server/config.js
- [[TIMEFRAMES]] - code - bloomline-dashboard/server/kpis.js
- [[TIMEFRAME_LABELS]] - code - bloomline-dashboard/server/kpis.js
- [[USERS_FILE]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[WEBHOOK_PORT]] - code - bloomline-dashboard/server/config.js
- [[__dirname]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[app]] - code - bloomline-dashboard/server/index.js
- [[atomicWrite()]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[badTimeframe()]] - code - bloomline-dashboard/server/routes/events.js
- [[bloomline-dashboardserveradapterslocal-file.js]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[bloomline-dashboardserveradapterssupabase.js]] - code - bloomline-dashboard/server/adapters/supabase.js
- [[bloomline-dashboardserverconfig.js]] - code - bloomline-dashboard/server/config.js
- [[bloomline-dashboardserverindex.js]] - code - bloomline-dashboard/server/index.js
- [[bloomline-dashboardserverkpis.js]] - code - bloomline-dashboard/server/kpis.js
- [[bloomline-dashboardserverroutescalendar.js]] - code - bloomline-dashboard/server/routes/calendar.js
- [[bloomline-dashboardserverroutesevents.js]] - code - bloomline-dashboard/server/routes/events.js
- [[bloomline-dashboardserverroutesusers.js]] - code - bloomline-dashboard/server/routes/users.js
- [[bloomline-dashboardserverrouteswebhook.js]] - code - bloomline-dashboard/server/routes/webhook.js
- [[bloomline-dashboardserverseed-sample.js]] - code - bloomline-dashboard/server/seed-sample.js
- [[bloomline-dashboardserverstore.js]] - code - bloomline-dashboard/server/store.js
- [[calendarRouter()]] - code - bloomline-dashboard/server/routes/calendar.js
- [[changeFor()]] - code - bloomline-dashboard/server/kpis.js
- [[computeKpis()]] - code - bloomline-dashboard/server/kpis.js
- [[config]] - code - bloomline-dashboard/server/index.js
- [[countAll()]] - code - bloomline-dashboard/server/kpis.js
- [[createLocalFileAdapter()]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[createStore()]] - code - bloomline-dashboard/server/store.js
- [[createSupabaseAdapter()]] - code - bloomline-dashboard/server/adapters/supabase.js
- [[dailyBookingBuckets()]] - code - bloomline-dashboard/server/kpis.js
- [[ensureDataDir()]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[eventsRouter()]] - code - bloomline-dashboard/server/routes/events.js
- [[hoursAgo()]] - code - bloomline-dashboard/server/seed-sample.js
- [[localDateKey()]] - code - bloomline-dashboard/server/kpis.js
- [[main()]] - code - bloomline-dashboard/server/seed-sample.js
- [[normalizeEvent()]] - code - bloomline-dashboard/server/adapters/supabase.js
- [[readJson()]] - code - bloomline-dashboard/server/adapters/local-file.js
- [[resolveConfig()]] - code - bloomline-dashboard/server/config.js
- [[resolveWindow()]] - code - bloomline-dashboard/server/kpis.js
- [[store]] - code - bloomline-dashboard/server/index.js
- [[topLeads()]] - code - bloomline-dashboard/server/kpis.js
- [[usersRouter()]] - code - bloomline-dashboard/server/routes/users.js
- [[webhookRouter()]] - code - bloomline-dashboard/server/routes/webhook.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Server_Data_Adapters
SORT file.name ASC
```
