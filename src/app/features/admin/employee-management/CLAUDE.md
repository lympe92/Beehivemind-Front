# Admin · Employee Management — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)).

## Purpose
CRUD for admin-panel employees and their roles.

## Route
`/admin/employees` → `employee-management.ts` (`EmployeeManagementComponent`). Guarded by `employeeRoleGuard('admin')` — admin/superadmin only.

## State & Data
- Direct `RequestService`: `GET/POST admin/employees`, `PUT/DELETE admin/employees/:id`.
- Local signals: `employees`, `loading`, `error`. The add/edit form is a `DynamicField[]` config (`fields(row)`) opened in `FormModalComponent` via `ModalService.open` — the same driver the dashboard dialogs use.
- **Roles:** `EmployeeRole = 'support' | 'moderator' | 'admin' | 'superadmin'` (from `store/employee-auth/employee-auth.state`). Rendered as the outlined neutral badge (`.app-badge--neutral`): a role is a fact, not a state.

## Gotchas
- On edit, the password field is optional (label says "leave blank to keep") and an empty value is deleted from the payload.
- Delete goes through `ModalService.confirm({ danger: true })` with a message naming the consequence ("loses access to the admin panel immediately").
- Load failure renders `<app-error>` with a retry inside the page, not a toast.

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions) · `store/employee-auth/`.
