# User Dashboard — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md).

## Purpose
Beekeeper home dashboard: inspection analytics (charts) and a disease-detection summary, filterable by user / apiary / beehive.

## Route
`/user/dashboard` → `dashboard.ts` (`UserDashboardComponent`), under `authGuard` (default user landing route).

## State & Data
- **Store (for filter + raw detections):** `apiaries`, `beehives`, `inspections` via `selectSignal`.
- **Chart data is fetched per-filter via service**, not the store: `InspectionService.getAvgInspectionsOfUser / getAvgInspectionsOfApiary / getInspectionsOfBeehive` → `chartInspections` signal. Subscriptions use `takeUntilDestroyed(this.destroyRef)`.
- **`ChartBuilderService`** builds line/bar/pie `ApexOptions` (all `computed`).

## Patterns / gotchas
- **`FilterLevel = 'user' | 'apiary' | 'beehive'`** drives both which chart endpoint is called and how `rawInspections` is filtered. The `FilterBarComponent` emits apiary/beehive changes (0 = clear).
- `detections` computes disease counts using `latestPerBeehive()` (latest inspection per hive) for user/apiary level, or the single latest record for beehive level (shows Yes/No).
- Chart options return `null` when there's no data — templates guard on that.

## Related
[Root](../../../../../CLAUDE.md) · [Inspections](../inspections/CLAUDE.md) (data source) · apex-chart, filter-bar UI.
