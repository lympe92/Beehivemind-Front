# Harvest — Claude Guide

> Follows the **"records" pattern** documented in [Inspections](../inspections/CLAUDE.md) — read that first. This file only notes Harvest specifics.

## Purpose
Record harvests (συγκομιδές): honey/product type, optional description, total quantity, unit.

## Route
`/user/harvest` → `harvest.ts` (`HarvestComponent`), under `authGuard`.

## State & Data
- **Store:** `harvest` (`selectAllHarvest`, `selectHarvestLoading`) + `apiaries` + `beehives`.
- **Service:** `core/services/harvest.service.ts` — `createHarvest / updateHarvest / deleteHarvest`.
- **Model:** `harvest.model.ts` — exports `HARVEST_TYPES`, `HARVEST_UNITS` and `HarvestType`/`HarvestUnit`.

## Specifics vs the records pattern
- **Beehive optional** like Feeding (`— All beehives —` → record scoped to `apiary_id`).
- `columns` is a `computed` — adds a "Beehive" column only when filtered to an apiary but not a single beehive.
- `honey_description` is only persisted when `honey_type === 'honey'` (cleared otherwise on both add and edit).

## Related
[Root](../../../../../CLAUDE.md) · [Inspections](../inspections/CLAUDE.md) (canonical) · [Feeding](../feeding/CLAUDE.md).
