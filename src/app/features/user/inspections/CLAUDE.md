# Inspections — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). **This is the canonical "records" feature** — Feeding and Harvest share the same structure; their docs reference this one.

## Purpose
Record hive inspections (επιθεωρήσεις): population, frames, brood, honey/pollen, disease flags (varroa, foulbrood, nosema), queen status.

## Route
`/user/inspections` → `inspections.ts` (`InspectionsComponent`), under `authGuard`.

## State & Data
- **Store:** `inspections` (`selectAllInspections`, `selectInspectionsLoading`) + `apiaries` + `beehives`. `ngOnInit` dispatches `load()` for all three.
- **The table:** client-side pages of 25 over the filtered list (`pagedInspections`, `tablePagination`; a filter change goes back to page 1). Sixteen readings do not fit a laptop, so the eight after Queen carry `className: 'dt__col--wide'` and hide below 1800 px — the Status badge reads them, and Edit has them all.
- **Service:** `core/services/inspection.service.ts` — `createInspection / updateInspection / deleteInspection` + analytics endpoints (`getInspectionsOfApiary`, `getAvgInspectionsOf*` used by dashboard/apiary-view). **Model:** `inspection.model.ts`.

## The "records" pattern (shared by Feeding & Harvest)
1. **Two-level filter** (`FilterBarComponent`): `selectedApiaryId` + `selectedBeehiveId` signals (0 = all). The visible list is a `computed` that filters store data by beehive → apiary → all.
2. **Add/Edit via `FormModalComponent`** (schema-driven) — pass `data: { title, fields: DynamicField[] }`. Fields built inline with `syncValidators` from `form/validators.config`. The apiary→beehive selects use `cascadeFrom: 'apiary_id'` with a function `options` (cascading dropdown).
3. **Duplicate guard:** before create, check `(beehiveId, date)` already exists → `toast.warning`, return.
4. **Payload mapping:** booleans (toggles) → `1 | 0` for the API (`toPayload`).
5. **Mutation → `reload()` + toast** (the root convention).

## The diagnosis (Status column)
Every inspection has a reading by the API's Rules Engine (no language model): a
`level` — `survival` / `attention` / `watch` / `ok` / `unknown` — plus risks,
actions and a reason. The API computes it on every write, so the page never
asks for one; it only reads. `loadDiagnoses()` fetches `GET diagnosis/records`
once (a summary per inspection of the last year, the same window as the list)
into a `Map<recordId, DiagnosisSummary>`, and again after every mutation. The
**Status** cell shows `<app-diagnosis-badge>` inside an `.app-badge-btn`, and the
click opens `DiagnosisModalComponent` with `{ recordId }` — the full reading,
with the beekeeper's "useful? yes/no" at the bottom (`POST inspections/{id}/feedback`).
Service `core/services/diagnosis.service.ts`, model `diagnosis.model.ts`.

## Gotchas
- The table leads with a **Beehive** column (name resolved from the `beehives` slice via `beehiveName()`) and a `mediumDate` date, both wrapped in `.dt__nowrap`; headers use the design system's short forms ("Pop.", "Q. year") so all fourteen readings fit one row. Feeding and Harvest follow the same shape (Beehive · Date · … · Quantity with unit).
- Edit strips `beehive_id` from the payload (`const { beehive_id, ...payload }`) — the beehive isn't reassigned on edit.
- Toggle fields use `value: !!row?.field`; `queen_exists` defaults to `true` on add.

## Related
[Root](../../../../../CLAUDE.md) · [Feeding](../feeding/CLAUDE.md) · [Harvest](../harvest/CLAUDE.md) · [Form System](../../../shared/components/ui/form/CLAUDE.md) · form-modal, filter-bar, data-table.
