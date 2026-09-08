# Admin · Raw Data — Claude Guide

> Admin-zone lighter pattern (see [User Management](../user-management/CLAUDE.md#admin-zone-conventions)). **Superadmin-only.** A generic, config-driven CRUD over raw DB tables.

## Purpose
A low-level admin tool to browse and edit any registered model/table directly — like a mini DB admin.

## Routes (`employeeRoleGuard('superadmin')`)
| Path | Component | Role |
|------|-----------|------|
| `/admin/raw` | `raw-index/raw-index.ts` (`RawIndexComponent`) | Index of available models |
| `/admin/raw/:model` | `raw-list/raw-list.ts` (`RawListComponent`) | Generic list + create/edit/delete for one model |

## How it works
- **`raw-data.models.ts`** is the registry: `RAW_MODELS: Record<string, ModelConfig>`. Each `ModelConfig` declares `endpoint`, `fields` (with `type`, `createOnly`), and `displayColumns`. **Add a new manageable table by adding an entry here** — the list/form/columns are all derived from it.
- `RawListComponent` reads `:model` from the route, looks up `config = RAW_MODELS[key]`, and generically:
  - builds `tableColumns` from `displayColumns`,
  - maps each registry `FieldConfig` to a `DynamicField` (`toDynamicField`: select→`select` with `of(options)`, boolean→`toggle`, date/datetime→`date`, textarea, email, password, number, text) and opens it in `FormModalComponent` (`createOnly` fields are dropped when editing),
  - calls `GET/POST/PUT/DELETE admin/raw/:endpoint[/:id]` via `RequestService`.

## State & Data
- Direct `RequestService`; server-side pagination (`{ data, meta }`).
- `signal` + `computed` (`config`, `isTokens`, `tableColumns`, `tablePagination`). Route param subscription uses `takeUntilDestroyed`.

## Gotchas
- Delete/revoke goes through `ModalService.confirm({ danger: true })`; the message says the write is direct ("nothing here checks what else points at this row").
- **`tokens` model is special:** the action is "Revoke" and calls `POST admin/raw/tokens/:id/revoke` instead of `DELETE`.
- A failed create/save surfaces `err.error.message` through `ToastService.error`.
- Index cards are `<a class="admin-model">` links; `id` cells render as `.admin-code`.

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions) · `raw-data.models.ts` (the registry).
