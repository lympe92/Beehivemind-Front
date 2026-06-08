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
- **`todo-list`:** no store — loads via `AgendaService.getAll()` into an `items` signal. `AgendaItem` has `isOverdue`, `scheduledDate`, `entityType`, `entityId`. `overdue` and `upcoming` (grouped by date with Today/Tomorrow labels) are `computed`.
- **`calendar-page`:** reads `inspections` + `beehives` from the **store** (`selectSignal`); `events` is a `computed` mapping inspections → `CalendarEvent[]`. Clicking an event navigates to `/user/inspections?id=…`.

## Patterns / gotchas
- **Mark done:** only `entityType === 'treatment_instance'` items can be completed → `TreatmentInstanceService.update(id, { status: 'done' })`, then add to a local `doneIds` set and dispatch `NotificationsActions.reload()` (keeps the notification bell in sync). Same logic appears in `apiary-view`.
- Inline SVG icons via `DomSanitizer.bypassSecurityTrustHtml` (shared with `apiary-view`).

## Related
[Root](../../../../../CLAUDE.md) · [Apiaries](../apiary/CLAUDE.md) (apiary-view shares mark-done) · [Treatments](../treatments/CLAUDE.md) · calendar UI component.
