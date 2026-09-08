# Admin · Coupons — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)).

## Purpose
Manage discount/trial coupons.

## Route
`/admin/coupons` → `coupons.ts` (`CouponsComponent`). Guarded by `employeeRoleGuard('admin')`.

## State & Data
- Direct `RequestService`: `GET admin/coupons`, `POST admin/coupons`, `PUT admin/coupons/:id`, `POST admin/coupons/:id/toggle`, `DELETE admin/coupons/:id`.
- Local signals; the add/edit form is a `DynamicField[]` config (`fields(row)`) opened in `FormModalComponent`.
- **Coupon shape:** `type = 'percentage' | 'free_period'`; `value_unit` (`'days' | 'months'`) only applies to `free_period`.

## Gotchas
- The `value_unit` field carries a real `conditions.disabled` rule (`type === 'percentage'` → disabled). A disabled control is left out of the form value, and `toPayload` only sends `value_unit` for a free period.
- `toggle(id)` flips active state via the dedicated `/toggle` endpoint.
- Delete goes through `ModalService.confirm({ danger: true })`; the message states how many times the code was used and that deleting does not reverse redemptions.
- `is_usable` renders as `Usable` / `Spent` (`.app-badge--active` / `--neutral`); `formatValue` renders `"X%"` vs `"X days/months"`.

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions).
