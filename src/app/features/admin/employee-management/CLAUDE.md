# Admin · Employee Management — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)).

## Purpose
CRUD for admin-panel employees and their roles.

## Route
`/admin/employees` → `employee-management.ts` (`EmployeeManagementComponent`). Guarded by `employeeRoleGuard('admin')` — admin/superadmin only.

## State & Data
- Direct `RequestService`: `GET/POST admin/employees`, `PUT/DELETE admin/employees/:id`.
- Local signals: `employees`, `loading`, `error`, plus `showForm`/`formMode`/`editingId` for an **inline form** (not a modal).
- **Roles:** `EmployeeRole = 'support' | 'moderator' | 'admin' | 'superadmin'` (from `store/employee-auth/employee-auth.state`).

## Gotchas
- On edit, an empty `password` field is deleted from the payload (don't overwrite the password).
- **Uses native `confirm()` for delete** — a deviation from the root "always `ModalService.confirm`" rule, characteristic of the admin zone. (Candidate for future cleanup if standardizing.)

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions) · `store/employee-auth/`.
