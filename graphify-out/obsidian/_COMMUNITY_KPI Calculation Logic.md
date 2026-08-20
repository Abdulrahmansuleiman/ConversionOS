---
type: community
cohesion: 0.24
members: 19
---

# KPI Calculation Logic

**Cohesion:** 0.24 - loosely connected
**Members:** 19 nodes

## Members
- [[KPI_DEFS_1]] - code - pipeline-dashboard/server/kpis.js
- [[TIMEFRAMES_1]] - code - pipeline-dashboard/server/kpis.js
- [[TIMEFRAME_LABELS_2]] - code - pipeline-dashboard/server/kpis.js
- [[badTimeframe()_1]] - code - pipeline-dashboard/server/routes/events.js
- [[changeFor()_1]] - code - pipeline-dashboard/server/kpis.js
- [[computeKpis()_1]] - code - pipeline-dashboard/server/kpis.js
- [[countAll()_1]] - code - pipeline-dashboard/server/kpis.js
- [[dailyBookingBuckets()_1]] - code - pipeline-dashboard/server/kpis.js
- [[dailySpeedBuckets()]] - code - pipeline-dashboard/server/kpis.js
- [[eventsRouter()_1]] - code - pipeline-dashboard/server/routes/events.js
- [[followUpSpeedHours()]] - code - pipeline-dashboard/server/kpis.js
- [[localDateKey()_1]] - code - pipeline-dashboard/server/kpis.js
- [[pipeline-dashboardserverkpis.js]] - code - pipeline-dashboard/server/kpis.js
- [[pipeline-dashboardserverroutesevents.js]] - code - pipeline-dashboard/server/routes/events.js
- [[ppChange()]] - code - pipeline-dashboard/server/kpis.js
- [[rate()]] - code - pipeline-dashboard/server/kpis.js
- [[resolveWindow()_1]] - code - pipeline-dashboard/server/kpis.js
- [[speedChange()]] - code - pipeline-dashboard/server/kpis.js
- [[topLeads()_1]] - code - pipeline-dashboard/server/kpis.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/KPI_Calculation_Logic
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Local File Storage]]

## Top bridge nodes
- [[pipeline-dashboardserverroutesevents.js]] - degree 10, connects to 1 community
- [[eventsRouter()_1]] - degree 8, connects to 1 community