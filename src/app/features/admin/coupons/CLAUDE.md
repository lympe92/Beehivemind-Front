# Admin · Coupons — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)).

## Purpose
Manage discount/trial coupons.

## Route
`/admin/coupons` → `coupons.ts` (`CouponsComponent`). Guarded by `employeeRoleGuard('admin')`.

## State & Data
- Direct `RequestService`: `GET admin/coupons`, `POST admin/coupons`, `PUT admin/coupons/:id`, `POST admin/coupons/:id/toggle`, `DELETE admin/coupons/:id`.
- Local signals + an inline form (`showForm`/`formMode`/`editingId`).
- **Coupon shape:** `type = 'percentage' | 'free_period'`; `value_unit` (`'days' | 'months'`) only applies to `free_period`.

## Gotchas
- `submitForm` only includes `value_unit` in the payload when `type === 'free_period'`.
- `toggle(id)` flips active state via the dedicated `/toggle` endpoint.
- **Native `confirm()` for delete** (admin-zone deviation).
- `formatValue` renders `"X%"` vs `"X days/months"` for display.

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions).
