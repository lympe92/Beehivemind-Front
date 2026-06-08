# Feeding — Claude Guide

> Follows the **"records" pattern** documented in [Inspections](../inspections/CLAUDE.md) — read that first. This file only notes Feeding specifics.

## Purpose
Record feeding events (ταΐσματα): feeding type, food type, quantity per beehive, unit.

## Route
`/user/feeding` → `feeding.ts` (`FeedingComponent`), under `authGuard`.

## State & Data
- **Store:** `feeding` (`selectAllFeeding`, `selectFeedingLoading`) + `apiaries` + `beehives`.
- **Service:** `core/services/feeding.service.ts` — `createFeeding / updateFeeding / deleteFeeding`.
- **Model:** `feeding.model.ts` — exports option constants `FEEDING_TYPES`, `FOOD_TYPES`, `FEEDING_UNITS` and types `FeedingType`/`FoodType`/`FeedingUnit` used to build the select fields.

## Specifics vs the records pattern
- **Beehive is optional:** the beehive select includes a `— All beehives —` (returns `null`) option. If no beehive chosen, the record is scoped to the **apiary** (`payload.apiary_id`) instead of `beehive_id`.
- Duplicate `(beehiveId, date)` guard only runs when a specific beehive is selected.
- Defaults: `feeding_type='stimulation'`, `food_type='sugar syrup'`, `unit='kg'`.

## Related
[Root](../../../../../CLAUDE.md) · [Inspections](../inspections/CLAUDE.md) (canonical) · [Harvest](../harvest/CLAUDE.md).
