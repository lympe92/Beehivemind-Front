# Financial — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md), with one notable difference: **this feature does NOT use the NgRx store** — it uses services + local signals directly.

## Purpose
Financial overview: income/outgoing cost tracking with charts, plus management of costs and cost categories.

## Route
`/user/financial` → `financial.ts` (`FinancialComponent`), under `authGuard`. **`OnPush` change detection.**

> Note: `costs/` and `cost-categories/` are **child components**, not separate routes — they're embedded inside the financial page (`imports: [CostsComponent, CostCategoriesComponent]`).

## Structure
| Component | File | Role |
|-----------|------|------|
| `FinancialComponent` | `financial/financial.ts` | Container: charts (ApexCharts) + hosts the two child tables |
| `CostsComponent` | `costs/costs.ts` | Cost records table (CRUD) — `input(costCategories)`, `output(costsChange)` |
| `CostCategoriesComponent` | `cost-categories/cost-categories.ts` | Category table (CRUD) — `output(categoriesChange)` |

## State & Data
- **No store.** Each component holds `signal`s for its own data and loads via service in `ngOnInit`.
- **Services:** `cost.service.ts` (`getCosts`, `createCost`, `updateCost`, `deleteCost`, plus analytics: `getMonthlyCosts`, `getYearCostSum`, `getIncomeCostsByCategory`, `getOutcomeCostsByCategory`), `cost-category.service.ts` (CRUD). **Models:** `cost.model.ts`, `cost-category.model.ts` (`CostType = 'income' | 'outcome'`).
- **`ChartBuilderService`** (`core/services/chart-builder.service.ts`) builds `ApexOptions` for `bar` / `pie` / `line` charts. Chart options are `computed` from data signals.

## Patterns / gotchas
- **Parent–child sync via outputs:** child CRUD emits `costsChange` / `categoriesChange`; `FinancialComponent` reloads charts / updates the categories signal in response.
- **Resilient chart loading:** `loadCharts()` uses `forkJoin` with per-request `catchError(() => of(null))` — one failed chart endpoint doesn't drop the others.
- CRUD still uses `FormModalComponent` + `ModalService.confirm` + `ToastService` (same as records pattern), just without the store.

## Related
[Root](../../../../../CLAUDE.md) · [Inspections](../inspections/CLAUDE.md) (form-modal pattern) · apex-chart, data-table, form-modal UI.
