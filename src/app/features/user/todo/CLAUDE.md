# Todo & Calendar — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). Covers both the `todo/` and sibling `calendar/` folders (same route group).

## Purpose
An **agenda**: scheduled/overdue tasks (mostly treatment instances) shown as a list and on a calendar.

## Routes (`user.routes.ts`, under `authGuard`)
| Path | Component | Role |
|------|-----------|------|
| `/user/todo` | redirects → `/user/todo/list` | |
| `/user/todo/list` | `todo/todo-list/todo-list.ts` (`TodoListComponent`) | Overdue + upcoming agenda items grouped by date |
| `/user/todo/calendar` | `calendar/calendar-page.ts` (`CalendarPageComponent`) | Calendar view of inspections |
| `/user/calendar` | redirects → `/user/todo/calendar` | (legacy alias) |

## State & Data
- **`todo-list`:** no store for the items — loads via `AgendaService.getAll()` into an `items` signal (`apiaries` slice for the badge names). `AgendaItem` has `isOverdue`, `scheduledDate`, `entityType`, `entityId`, `apiaryId`. The page is the design system's to-do list: one flat `pending` list sorted by date (checkbox · title · apiary badge · date, overdue dates in the danger colour) and a `done` section for items ticked this session. There is no composer — an agenda item is created by scheduling a treatment, not typed here.
- **`calendar-page`:** reads `inspections` + `beehives` from the **store** (`selectSignal`); `events` is a `computed` mapping inspections → `CalendarEvent[]`. Clicking an event navigates to `/user/inspections?id=…`.

## Patterns / gotchas
- **Mark done:** only `entityType === 'treatment_instance'` items have an enabled checkbox (`completable()`) → `TreatmentInstanceService.update(id, { status: 'done' })`, then add to a local `doneIds` set and dispatch `NotificationsActions.reload()` (keeps the notification bell in sync). Inspection items render a disabled checkbox: an inspection is recorded, not ticked.
- Row layout is the tokens-only `todo-list.scss` (`.todo-row*`); everything else is the app vocabulary.

## Related
[Root](../../../../../CLAUDE.md) · [Apiaries](../apiary/CLAUDE.md) (apiary-view shares mark-done) · [Treatments](../treatments/CLAUDE.md) · calendar UI component.
