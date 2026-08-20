---
type: community
cohesion: 0.22
members: 9
---

# Chart and Server Deps

**Cohesion:** 0.22 - loosely connected
**Members:** 9 nodes

## Members
- [[dependencies_1]] - code - launchops-portal/package.json
- [[express_2]] - code - launchops-portal/package.json
- [[express_3]] - concept - launchops-portal/package.json
- [[react_2]] - code - launchops-portal/package.json
- [[react_3]] - concept - launchops-portal/package.json
- [[recharts]] - code - bloomline-dashboard/package.json
- [[recharts_1]] - code - launchops-portal/package.json
- [[recharts_3]] - concept - launchops-portal/package.json
- [[recharts_2]] - code - pipeline-dashboard/package.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Chart_and_Server_Deps
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Core Web Dependencies]]
- 1 edge to [[_COMMUNITY_Portal Package Config]]
- 1 edge to [[_COMMUNITY_Environment Variable Utility]]
- 1 edge to [[_COMMUNITY_React DOM Library]]
- 1 edge to [[_COMMUNITY_React Icons Library]]
- 1 edge to [[_COMMUNITY_Supabase Integration]]

## Top bridge nodes
- [[dependencies_1]] - degree 8, connects to 5 communities
- [[recharts]] - degree 2, connects to 1 community
- [[recharts_2]] - degree 2, connects to 1 community