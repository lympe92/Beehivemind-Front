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
  - renders a dynamic form from `fields` (`visibleFields` hides `createOnly` fields when editing),
  - calls `GET/POST/PUT/DELETE admin/raw/:endpoint[/:id]` via `RequestService`.

## State & Data
- Direct `RequestService`; server-side pagination (`{ data, total, last_page }`).
- Heavy use of `signal` + `computed` (`config`, `visibleFields`, `tableColumns`, `tablePagination`). Route param subscription uses `takeUntilDestroyed`.
- Form is a generic `formData = signal<Record<string, unknown>>` with `getField`/`setField`.

## Gotchas
- **Custom confirm modal** (in-component `showModal`/`deleteConfirmId` signals, not `ModalService`).
- **`tokens` model is special:** delete calls `POST admin/raw/tokens/:id/revoke` instead of `DELETE`.
- `formError` is populated from `err.error.message` on failed submit.

## Related
[Root](../../../../CLAUDE.md) · [User Management](../user-management/CLAUDE.md) (admin conventions) · `raw-data.models.ts` (the registry).
