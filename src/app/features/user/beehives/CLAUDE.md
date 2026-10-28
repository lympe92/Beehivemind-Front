# Beehives — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md).

## Purpose
Manage beehives (κυψέλες) within apiaries — bulk-create, renumber, set queen year, show QR code, delete.

**A hive has a number, never a name** (product decision, 2026-10). The number is an integer ≥ 1, unique within its apiary; the API numbers new hives itself (the apiary's highest + 1) and answers a duplicate with 422 `"Beehive {number} already exists in this apiary."`. Every page labels a hive through `beehiveLabel()` → "Beehive 12", or `beehiveTag()` → "#12" in a table cell under a **Beehive** header (both in `core/models/beehive.model.ts`).

## Route
`/user/beehives` → `beehives.ts` (`BeehivesComponent`), under `authGuard`.

## State & Data
- **Store:** `beehives` (`selectAllBeehives`, `selectBeehivesLoading`) + `apiaries` (`selectAllApiaries`) for the filter dropdown.
- **Service:** `core/services/beehive.service.ts` — `createBeehives(apiaryId, count)` (bulk, `hives_number`; the API picks the numbers), `updateBeehive` (sends `{ number }`), `deleteBeehive`. Lists come back sorted by `compareBeehives` (apiary, then number), so every list and dropdown fed from the slice is in number order. **Model:** `beehive.model.ts` (`number`, `uuid`, `queen?.year`).

## UI specifics
- **Apiary filter** via `FilterBarComponent`; `selectedApiaryId` signal (0 = all). `beehives` is a `computed` filtered list.
- **Columns:** Beehive (`#12`) · Apiary (only when the filter is "All": two apiaries both have a Beehive 1) · Queen Year.
- **Inline edit** (not a modal): `editingId` + `editForm` (`FormsModule`, `[(ngModel)]`), confirmed with `confirmEdit()`. The **Number** field is a numeric input; `numberError()` says what is wrong under it (required · whole number ≥ 1 · the API's refusal) and disables Save.
- **Bulk create:** enter a count → `createBeehives(apiaryId, count)`. Requires an apiary selected first (else `toast.error`).
- **QR code:** `showQr()` opens `QrCodeModalComponent` with the beehive `uuid`.

## Patterns / gotchas
- Mutations dispatch `BeehivesActions.reload()` (not apiaries).
- Local validation before save: number required, integer, ≥ 1 (inline, under the field); queen year ≥ 2000 or empty (`toast.error`).
- **A taken number:** `updateBeehive` carries `inlineErrors(422)`, so the interceptor leaves only that status to the row — the server's message goes into `numberRefusal` and shows under the field; typing again clears it. Every other status (401 included) is still handled by the interceptor.
- `updateBeehive` sends only `number` — the queen year typed in the row is not part of the PUT (it never was; the service dropped it before the number change too).
- The delete dialog gets `label` ("Beehive 12") and targets labelled "Beehive 3 · North Field" — the queen can move to a hive in another apiary.

## Related
[Root](../../../../../CLAUDE.md) · [Apiaries](../apiary/CLAUDE.md) · qr-code-modal, filter-bar, data-table UI.
