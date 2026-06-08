# Admin · User Management — Claude Guide

> ⚠️ **Admin zone uses a lighter pattern than the user zone** — see [Admin conventions](#admin-zone-conventions) below.

## Purpose
Admin view of beekeeper accounts: search/filter, change status, force email confirmation.

## Route
`/admin/users` → `user-management.ts` (`UserManagementComponent`), under `employeeGuard`.

## State & Data
- **No store, no domain service** — calls `RequestService` directly against `admin/*` endpoints:
  - `GET admin/users?page&search&status&plan` (server-side paginated `{ data, meta }`)
  - `POST admin/users/:id/status`, `POST admin/users/:id/force-confirm`
- Local `signal`s: `users`, `loading`, `error`, `total`, `page`; plain fields for `search`/`statusFilter`/`planFilter` (`FormsModule`).
- Reads `selectIsAtLeastModerator` from `employeeAuth` store (via `toSignal`) to gate actions by role.

## Admin zone conventions
These differ from the user-zone conventions in the [root](../../../../CLAUDE.md):
- **Direct `RequestService`** (no per-entity service, no `fromApi` mapping — admin types are local `interface`s in snake_case).
- **Local-signal state**, server-side pagination — **not** NgRx.
- **Inline data shapes** (`PaginatedResponse<T>`, `AdminUser`) declared in the component.
- Success reloads silently (no `ToastService`); errors set an `error` signal.

## Related
[Root](../../../../CLAUDE.md) · `store/employee-auth/` · [Employees](../employee-management/CLAUDE.md) · [Coupons](../coupons/CLAUDE.md) · [Raw Data](../raw-data/CLAUDE.md).
