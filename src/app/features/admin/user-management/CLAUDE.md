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
- Local `signal`s: `users`, `loading`, `error`, `total`, `page`; plain fields for `search`/`statusFilter`/`planFilter` (`FormsModule`), rendered in the dashboard's `.fb` filter bar. The header meta reads "shown of total" like the kit (`users().length` on this page of `meta.total` matching the filters).
- Reads `selectIsAtLeastModerator` / `selectIsAtLeastAdmin` from `employeeAuth` store (via `toSignal`) to gate actions by role.
- Suspend opens `SuspendUserModalComponent` (indefinite / until a date); ban and delete go through `ModalService.confirm({ danger: true })` — the delete message names what else is deleted with the account.
- Status is a tinted badge (`.app-badge--active|--suspended|--banned`); plan is the outlined neutral badge.
- **Teams:** each row carries `team` (`{ role, owner_id, owner_name, member_count }`). The name cell adds "Editor · Daniel Hart's team" or "Owner · 2 team members" (the members card's `.team__who` cell). An editor's `plan` is the owner's — the API sends it and filters by it, and refuses to set a plan on an editor — so the badge adds a muted "via owner". The delete confirm says what the API will do: an owner's deletion takes the team and its members' accounts, an editor's leaves their records with the team.

## Admin zone conventions
These differ from the user-zone conventions in the [root](../../../../CLAUDE.md):
- **Direct `RequestService`** (no per-entity service, no `fromApi` mapping — admin types are local `interface`s in snake_case).
- **Local-signal state**, server-side pagination — **not** NgRx.
- **Inline data shapes** (`PaginatedResponse<T>`, `AdminUser`) declared in the component.
- Success reloads silently (no `ToastService`); a load failure renders `<app-error>` with a retry inside the page.
- **Visuals are the dashboard's:** `.app-page` + `.app-page-header`, `.card` (`[flush]` around a `DataTable`), `.app-btn`, `.app-badge`, `.fb`. Forms are `FormModalComponent` + `DynamicField[]`; confirms are `ModalService.confirm`. No admin-only CSS.

## Related
[Root](../../../../CLAUDE.md) · `store/employee-auth/` · [Employees](../employee-management/CLAUDE.md) · [Coupons](../coupons/CLAUDE.md) · [Raw Data](../raw-data/CLAUDE.md).
