# Beehives — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md).

## Purpose
Manage beehives (κυψέλες) within apiaries — bulk-create, rename, set queen year, show QR code, delete.

## Route
`/user/beehives` → `beehives.ts` (`BeehivesComponent`), under `authGuard`.

## State & Data
- **Store:** `beehives` (`selectAllBeehives`, `selectBeehivesLoading`) + `apiaries` (`selectAllApiaries`) for the filter dropdown.
- **Service:** `core/services/beehive.service.ts` — `createBeehives(apiaryId, count)` (bulk), `updateBeehive`, `deleteBeehive`. **Model:** `beehive.model.ts` (has `uuid`, `queen?.year`).

## UI specifics
- **Apiary filter** via `FilterBarComponent`; `selectedApiaryId` signal (0 = all). `beehives` is a `computed` filtered list.
- **Inline edit** (not a modal): `editingId` + `editForm` (`FormsModule`, `[(ngModel)]`), confirmed with `confirmEdit()`.
- **Bulk create:** enter a count → `createBeehives(apiaryId, count)`. Requires an apiary selected first (else `toast.error`).
- **QR code:** `showQr()` opens `QrCodeModalComponent` with the beehive `uuid`.

## Patterns / gotchas
- Mutations dispatch `BeehivesActions.reload()` (not apiaries).
- Local validation before save: name required, queen year ≥ 2000 or empty — `toast.error` on failure.
- Edit payload maps `queen_year` → `queen: { year } | null`.

## Related
[Root](../../../../../CLAUDE.md) · [Apiaries](../apiary/CLAUDE.md) · qr-code-modal, filter-bar, data-table UI.
