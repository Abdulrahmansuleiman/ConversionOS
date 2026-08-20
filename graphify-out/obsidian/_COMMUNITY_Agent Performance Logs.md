---
type: community
cohesion: 1.00
members: 1
---

# Agent Performance Logs

**Cohesion:** 1.00 - tightly connected
**Members:** 1 nodes

## Members
- [[Proposal Agent Performance Log]] - rationale - docs/performance/proposal.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Agent_Performance_Logs
SORT file.name ASC
```
