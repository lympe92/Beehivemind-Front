# Treatments — Claude Guide

> Feature doc. Follows the conventions in the [root CLAUDE.md](../../../../../CLAUDE.md) — this file only covers what's specific to Treatments. Use it as the **template for other feature docs**.

## Purpose
Manage hive treatments (e.g. varroa). Two concepts:
- **Treatment Type** — a reusable definition (name, etc.). Created/edited/deleted here.
- **Treatment Session** — an applied treatment: a type + start date + a set of beehives (optionally scoped to one apiary) + notes. A session fans out into per-hive **Instances** (each with a `status`, e.g. `'done'`).

## Routes
Defined in `features/user/user.routes.ts`, under `authGuard` (user zone).

| Path | Component | Role |
|------|-----------|------|
| `/user/treatments` | `treatments.ts` (`TreatmentsComponent`) | List of treatment **types**; create/edit/delete a type, or "apply" a type to start a session |
| `/user/treatments/details` | `treatments-details.ts` (`TreatmentsDetailsComponent`) | List of treatment **sessions** with progress; start or delete a session |

## Files
| File | Role |
|------|------|
| `treatments.ts` / `.html` / `.scss` | Types list page |
| `treatments-details.ts` / `.html` / `.scss` | Sessions list page |

## State & Data

**Store slices (display data via `selectSignal`):**
- `store/treatment-types` — `selectAllTreatmentTypes`, `selectTreatmentTypesLoading`
- `store/treatment-sessions` — `selectAllTreatmentSessions`, `selectTreatmentSessionsLoading`
- Also reads `store/apiaries` (`selectAllApiaries`) and `store/beehives` for names / selection.

`ngOnInit` dispatches `load()` for all of the above (cached — no-op if already loaded).

**Services (mutations only):**
- `core/services/treatment-type.service.ts` — `create / update / delete` types
- `core/services/treatment-session.service.ts` — `create / delete` sessions; maps snake_case `TreatmentSessionPayload` → camelCase `TreatmentSession` via `fromApi()`, and nests `instances` (via `TreatmentInstanceService`) + `treatmentType` (via `TreatmentTypeService`).

**Models:** `core/models/treatment-type.model.ts`, `treatment-session.model.ts`, `treatment-instance.model.ts`.

## Modals used
Both live under `shared/components/ui/modal/` (reusable, not feature-scoped):
- `treatment-type-modal` — create/edit a type. Opened with `data: {}` (create) or `data: { type }` (edit).
- `treatment-session-modal` — start a session. Opened with `data: { types, preselectedTypeId? }`; returns `{ treatmentTypeId, apiaryId, startDate, beehiveIds, notes }`.

## Flow (canonical mutation pattern)
Same as the root convention: open modal → `if (!result) return` → call service → on `res.success` dispatch `reload()` + `toast.success`, else `toast.error`. Deleting a **type** also reloads `treatmentSessions` (cascade — deleting a type removes its sessions). Deleting a **session** removes its instances.

## Helpers worth knowing
- `apiaryName(id)` — resolves an apiary id to its name, `'All Apiaries'` when `null`.
- `instancesDone(session)` — counts `instances` with `status === 'done'` (drives progress display).

## Related
- [Root CLAUDE.md](../../../../../CLAUDE.md) · [Form System](../../../shared/components/ui/form/CLAUDE.md)
- Sibling features that share the apiaries/beehives slices: Inspections, Feeding, Harvest.
