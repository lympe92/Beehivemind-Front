# Apiaries — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). The largest user feature (4 routes).

## Purpose
Manage apiaries (μελισσοκομεία) — locations with GPS coordinates that hold beehives. Includes a map view and a per-apiary detail dashboard.

## Routes (`user.routes.ts`, under `authGuard`)
| Path | Component | Role |
|------|-----------|------|
| `/user/apiary` | `apiary.ts` (`ApiaryComponent`) | Paginated **table** of apiaries; add/edit/delete |
| `/user/apiary/details` | `apiary-details.ts` (`ApiaryDetailsComponent`) | Card list of apiaries + per-apiary pending-todo counts (from `AgendaService`) |
| `/user/apiary/map` | `apiary-map.ts` (`ApiaryMapComponent`) | Map of all apiaries |
| `/user/apiary/:id` | `apiary-view/apiary-view.ts` (`ApiaryViewComponent`) | Single-apiary dashboard: weather, recent inspections, todos, treatment sessions |

## State & Data
- **Store:** `apiaries` (`selectAllApiaries`, `selectApiariesLoading`) + `beehives`. List/details read via `selectSignal`.
- **`apiary-view`** loads its apiary directly via `ApiaryService.getApiary(id)` (single record, not from store), plus `InspectionService.getInspectionsOfApiary`, `AgendaService.getByApiary`, and reads `treatmentSessions` from store filtered by `apiaryId`.
- **Service:** `core/services/apiary.service.ts` — `createApiary / updateApiary / deleteApiary / getApiary`. **Model:** `apiary.model.ts`.

## Modal
`shared/components/ui/modal/apiary-form-modal/` — create (`data: {}`) / edit (`data: { apiary }`). Returns `{ name, hivesNumber, latitude, longitude, location?, dateEstablished? }`. Uses the map picker for coordinates.

## Patterns / gotchas
- **Mutations reload BOTH slices:** `private reload()` dispatches `ApiariesActions.reload()` **and** `BeehivesActions.reload()` (deleting an apiary cascades to its beehives).
- **Duplicate-name guard:** before create, checks `existingNames.includes(value.name.trim())` → `toast.warning`, returns early.
- `apiary.ts` paginates **client-side** via a `page` signal + `computed` slice (`perPage = 10`).
- `apiary-view` builds inline SVG icons via `DomSanitizer.bypassSecurityTrustHtml` and marks treatment instances done via `TreatmentInstanceService.update(id, { status: 'done' })` → dispatches `NotificationsActions.reload()`.

## Related
[Root](../../../../../CLAUDE.md) · [Beehives](../beehives/CLAUDE.md) · [Treatments](../treatments/CLAUDE.md) · weather-card, map-picker UI components.
