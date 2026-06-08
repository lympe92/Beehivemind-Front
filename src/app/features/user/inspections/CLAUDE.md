# Inspections — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). **This is the canonical "records" feature** — Feeding and Harvest share the same structure; their docs reference this one.

## Purpose
Record hive inspections (επιθεωρήσεις): population, frames, brood, honey/pollen, disease flags (varroa, foulbrood, nosema), queen status.

## Route
`/user/inspections` → `inspections.ts` (`InspectionsComponent`), under `authGuard`.

## State & Data
- **Store:** `inspections` (`selectAllInspections`, `selectInspectionsLoading`) + `apiaries` + `beehives`. `ngOnInit` dispatches `load()` for all three.
- **Service:** `core/services/inspection.service.ts` — `createInspection / updateInspection / deleteInspection` + analytics endpoints (`getInspectionsOfApiary`, `getAvgInspectionsOf*` used by dashboard/apiary-view). **Model:** `inspection.model.ts`.

## The "records" pattern (shared by Feeding & Harvest)
1. **Two-level filter** (`FilterBarComponent`): `selectedApiaryId` + `selectedBeehiveId` signals (0 = all). The visible list is a `computed` that filters store data by beehive → apiary → all.
2. **Add/Edit via `FormModalComponent`** (schema-driven) — pass `data: { title, fields: DynamicField[] }`. Fields built inline with `syncValidators` from `form/validators.config`. The apiary→beehive selects use `cascadeFrom: 'apiary_id'` with a function `options` (cascading dropdown).
3. **Duplicate guard:** before create, check `(beehiveId, date)` already exists → `toast.warning`, return.
4. **Payload mapping:** booleans (toggles) → `1 | 0` for the API (`toPayload`).
5. **Mutation → `reload()` + toast** (the root convention).

## Gotchas
- Edit strips `beehive_id` from the payload (`const { beehive_id, ...payload }`) — the beehive isn't reassigned on edit.
- Toggle fields use `value: !!row?.field`; `queen_exists` defaults to `true` on add.

## Related
[Root](../../../../../CLAUDE.md) · [Feeding](../feeding/CLAUDE.md) · [Harvest](../harvest/CLAUDE.md) · [Form System](../../../shared/components/ui/form/CLAUDE.md) · form-modal, filter-bar, data-table.
