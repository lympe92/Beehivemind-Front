# beehivemind-Front — Claude Guide

## Tech Stack
- **Angular 21** — standalone components, signals, lazy-loaded routes
- **NgRx** (`@ngrx/store` + `@ngrx/effects` + store-devtools) for domain state
- **Angular CDK** (`@angular/cdk/dialog`) for overlays
- **SSR** (`@angular/ssr`, Express) with client hydration + store hydration meta-reducer
- **Google Maps** (`@angular/google-maps`), **ApexCharts** (`ngx-apexcharts`), **qrcode**

## Commands
| Command | Action |
|---------|--------|
| `npm start` | Dev server on **port 4201** (`ng serve --port 4201`) |
| `npm run build` | Production build (SSR) |
| `npm test` | Unit tests (Vitest) |
| `npm run format` | Prettier write over `src/**` |

---

## Architecture & Folder Map

Layered architecture. Data flows: **`RequestService` → domain service → `ApiResponse<T>` → NgRx effect → store → component (signals)**.

| Path | Role |
|------|------|
| `src/app/core/services/` | HTTP base (`request.service.ts`) + one domain service per entity |
| `src/app/core/models/` | TypeScript models (camelCase, the app-facing shape) |
| `src/app/core/guards/` | Route guards (`auth`, `employee`, `employee-role`) |
| `src/app/core/interceptors/` | `auth.interceptor` (token), `error.interceptor` (global error → toast) |
| `src/app/core/modal/` | `ModalService` + types (see Modal System below) |
| `src/app/store/` | NgRx slices — one folder per entity (see State Management) |
| `src/app/features/` | Route-level pages, grouped by zone: `public/ auth/ user/ admin/` |
| `src/app/layouts/` | Shell layouts: `public-layout`, `user-layout`, `admin-layout` |
| `src/app/shared/components/ui/` | Reusable UI primitives (form, modal, toast, card, map, table, chart…) |
| `src/app/shared/components/*-sections/` | Landing-page content blocks (hero, cta, info) |

**Each feature folder has its own `CLAUDE.md`** documenting that feature — see the [Feature Map](#feature-map) index below. The root file is the hub; feature files are spokes. When working on a feature, read its `CLAUDE.md` first.

---

## Route Zones & Guards

Top-level routes in `app.routes.ts`, all lazy-loaded. Four zones, each with its own layout:

| Zone | Path | Guard | Layout | Features dir |
|------|------|-------|--------|--------------|
| Public (marketing) | `/` | — | `public-layout` | `features/public/` |
| Auth | `/auth` | — | `public-layout` | `features/auth/` |
| User (beekeeper) | `/user` | `authGuard` | `user-layout` | `features/user/` |
| Admin login | `/admin/login` | — | none | `features/admin/login` |
| Admin panel | `/admin` | `employeeGuard` + `employeeRoleGuard(role)` | `admin-layout` | `features/admin/` |

`employeeRoleGuard('admin' \| 'superadmin')` gates individual admin routes (e.g. `raw` is superadmin-only).

---

## Code Conventions

> Derived from the existing code. New code must match these patterns — don't introduce alternatives.

**Dependency injection** — always `inject()`, never constructor params. Private fields, aligned.
```ts
private store = inject(Store);
private toast = inject(ToastService);
private modal = inject(ModalService);
```

**Reactive state — signals, NOT getters.** Read store state via `selectSignal`, expose as `readonly`, call as `this.types()`.
```ts
readonly types        = this.store.selectSignal(selectAllTreatmentTypes);
readonly typesLoading = this.store.selectSignal(selectTreatmentTypesLoading);
```
❌ No `get types()`, no manual `subscribe` for state in components, no `BehaviorSubject` in components.

**Async/await for modals** — handlers return `Promise<void>`. Open modal, early-return if cancelled, then the API call.
```ts
async addType(): Promise<void> {
  const result = await this.modal.open<Partial<TreatmentType>>(TreatmentTypeModalComponent, {
    type: 'center', width: '560px', data: {},
  });
  if (!result) return;
  // ...service call
}
```

**Confirm** — via `modal.confirm({ ..., danger: true })`, never native `confirm()`/`alert()`.

**API call → reload → toast** — the canonical mutation pattern. Check `res.success`, dispatch the slice's `reload()`, toast. The `error` callback is empty — `errorInterceptor` handles HTTP errors globally.
```ts
this.typeService.create(result).subscribe({
  next: res => {
    if (res.success) {
      this.store.dispatch(TreatmentTypesActions.reload());
      this.toast.success('Treatment type created.');
    } else {
      this.toast.error('Something went wrong. Please try again.');
    }
  },
  error: () => {},
});
```

**Toaster** — only `ToastService`; `success` after success, `error` after `!success`. Never inline notification state. (See Toast System.)

**Forms** — schema-driven via `FormManagementService` + `<app-form>` (see [`ui/form/CLAUDE.md`](src/app/shared/components/ui/form/CLAUDE.md)). Modals contain `<app-form>` → `dialogRef.close(formValue)`.

**Services = thin domain wrappers** over `RequestService`. The API speaks **snake_case**; each service declares an `interface XxxPayload` (snake) + a `fromApi()` mapper → camelCase model, and returns `Observable<ApiResponse<T>>`.
```ts
getAll(): Observable<ApiResponse<TreatmentSession[]>> {
  return this.request.getRequest<TreatmentSessionPayload[]>('treatment-sessions').pipe(
    map(res => ({ ...res, data: (res.data ?? []).map(s => this.fromApi(s)) }))
  );
}
```

**Lifecycle** — `ngOnInit` dispatches `load()` actions; it does not fetch data directly.

**Components** — `standalone: true`, explicit `imports`, `templateUrl`/`styleUrl` (no inline templates).

---

## HTTP Layer

- **`RequestService`** (`core/services/request.service.ts`) — thin wrapper: `getRequest / postRequest / putRequest / patchRequest / deleteRequest`, prefixes `environment.apiUrl`, types everything as `ApiResponse<T>`.
- **`ApiResponse<T>`** (`core/models/api-response.model.ts`) — every response has `success` + `data`. Components branch on `res.success`.
- **Interceptors** (registered in `app.config.ts`): `authInterceptor` attaches the token; `errorInterceptor` catches HTTP errors and surfaces them (hence empty `error: () => {}` in components).

---

## State Management (NgRx)

One **slice per entity** in `store/<entity>/`, registered in `store/index.ts` (`appReducers` + `appEffects`). Each slice has 5 files with a fixed shape:

| File | Contents |
|------|----------|
| `*.state.ts` | `interface XxxState { data[]; loading; loaded; error }` + `initialState` |
| `*.actions.ts` | `createActionGroup` — `Load`, `Reload`, `Load Success`, `Load Failure` |
| `*.reducer.ts` | `createReducer` over the actions |
| `*.effects.ts` | `load$` (cached) + `reload$` (force) effects calling the service |
| `*.selectors.ts` | `selectAll…`, `select…Loading`, `select…Loaded` |

**Caching pattern (important):**
- `load()` → effect skips the API if `loaded` is already true (`filter([, loaded] => !loaded)`). Components dispatch `load()` freely in `ngOnInit`; it's a no-op when data is present.
- `reload()` → always re-fetches. Dispatch after a mutation (create/update/delete) to refresh.

Components never subscribe to services for *display* data — they `selectSignal` from the store. Services are called directly only for **mutations**, followed by `reload()`.

**SSR/hydration:** `store/hydration.meta-reducer.ts` rehydrates store state on the client (registered as a `META_REDUCERS` factory in `app.config.ts`). Platform-sensitive code must guard with `PLATFORM_ID` / `isPlatformBrowser`.

---

## Domain Glossary

| Term | Meaning |
|------|---------|
| **Apiary** (μελισσοκομείο) | A location holding multiple beehives; has GPS coordinates |
| **Beehive** (κυψέλη) | An individual hive, belongs to an apiary |
| **Inspection** (επιθεώρηση) | A recorded hive check |
| **Feeding** (τάισμα) | A feeding record |
| **Harvest** (συγκομιδή) | A honey/product harvest record |
| **Treatment Type** | A reusable treatment definition (e.g. for varroa) |
| **Treatment Session** | An applied treatment across selected beehives; contains per-hive **Instances** |
| **Cost / Cost Category** | Financial expense tracking |
| **Employee** | Admin-panel user (role: `admin` / `superadmin`), distinct from a beekeeper User |

---

## Feature Map

Each row links to that feature's own `CLAUDE.md`.

| Feature | Route | Store slice(s) | Docs |
|---------|-------|----------------|------|
| Dashboard | `/user/dashboard` | `apiaries`, `beehives`, `inspections` | [↗](src/app/features/user/dashboard/CLAUDE.md) |
| Apiaries | `/user/apiary` (+ `/details`, `/map`, `/:id`) | `apiaries`, `beehives` | [↗](src/app/features/user/apiary/CLAUDE.md) |
| Beehives | `/user/beehives` | `beehives` | [↗](src/app/features/user/beehives/CLAUDE.md) |
| Inspections | `/user/inspections` | `inspections` | [↗](src/app/features/user/inspections/CLAUDE.md) |
| Feeding | `/user/feeding` | `feeding` | [↗](src/app/features/user/feeding/CLAUDE.md) |
| Harvest | `/user/harvest` | `harvest` | [↗](src/app/features/user/harvest/CLAUDE.md) |
| Treatments | `/user/treatments` (+ `/details`) | `treatmentTypes`, `treatmentSessions` | [↗](src/app/features/user/treatments/CLAUDE.md) |
| Financial | `/user/financial` | — (services only; `costs/` + `cost-categories/` are child components, not routes) | [↗](src/app/features/user/financial/CLAUDE.md) |
| Todo / Calendar | `/user/todo/{list,calendar}` | `inspections`, `beehives` | [↗](src/app/features/user/todo/CLAUDE.md) |
| AI Chat | `/user/ai-chat` (+ `/:id`) | `aiChat` | [↗](src/app/features/user/ai-chat/CLAUDE.md) |
| Profile | `/user/profile` | `profile` | [↗](src/app/features/user/profile/CLAUDE.md) |
| Admin · Users | `/admin/users` | — (direct `RequestService`) | [↗](src/app/features/admin/user-management/CLAUDE.md) |
| Admin · Employees | `/admin/employees` | — | [↗](src/app/features/admin/employee-management/CLAUDE.md) |
| Admin · Coupons | `/admin/coupons` | — | [↗](src/app/features/admin/coupons/CLAUDE.md) |
| Admin · Raw Data | `/admin/raw` (+ `/:model`) | — | [↗](src/app/features/admin/raw-data/CLAUDE.md) |

> When you add a new feature, create its `CLAUDE.md` using [`treatments/CLAUDE.md`](src/app/features/user/treatments/CLAUDE.md) as the template and add a row here.

> **Admin-zone deviation:** admin features use a lighter pattern than the user zone — direct `RequestService` (no domain service / no store), local-signal state, inline forms, and some still use native `confirm()`. Each admin feature doc flags this; details in [`user-management/CLAUDE.md`](src/app/features/admin/user-management/CLAUDE.md#admin-zone-conventions).

---

## Form System

Schema-driven dynamic forms with reactive validation, conditional fields, and ControlValueAccessor-based field components.

**Full documentation:** [`src/app/shared/components/ui/form/CLAUDE.md`](src/app/shared/components/ui/form/CLAUDE.md)

Quick summary:
- Define `DynamicField[]` config → `FormManagementService` builds the `FormGroup`
- Render with `<app-form [fields]="..." (submitForm)="..."/>`
- Typical pattern: open a modal → modal contains `<app-form>` → `dialogRef.close(formValue)` on submit
- Validators live in `validators.config.ts` (sync, async, cross-field)
- Add new field types by implementing `ControlValueAccessor` + registering in `form.component.html`

---

## Modal System

### Overview
Modals are powered by Angular CDK `Dialog`. All overlay styles are **global** (in `src/styles/_modal.scss`) because CDK renders panels at `<body>` level — never scope them inside a component.

### Key files
| File | Role |
|------|------|
| `src/app/core/modal/modal.types.ts` | Types: `ModalType`, `ModalConfig`, `ConfirmConfig`, `MODAL_DATA` token |
| `src/app/core/modal/modal.service.ts` | `ModalService` — single entry point for opening modals |
| `src/app/shared/components/ui/modal/modal-shell/modal-shell.ts` | Shell wrapper component (header, body, optional footer slot) |
| `src/app/shared/components/ui/modal/confirm-modal/confirm-modal.ts` | Built-in confirm dialog (uses `ModalShellComponent`) |
| `src/styles/_modal.scss` | Global CDK panel + backdrop styles |

### ModalService API

```ts
// Inject
private modal = inject(ModalService);

// Open any component as a modal — returns Promise<TResult | undefined>
await this.modal.open(MyComponent, {
  type: 'center',   // 'center' | 'drawer' | 'confirm'
  data: { ... },    // injected via MODAL_DATA token
  width: '640px',   // optional override
  disableClose: false,
});

// Shorthand for confirm dialogs — returns Promise<boolean>
const confirmed = await this.modal.confirm({
  title: 'Delete item',
  message: 'Are you sure?',
  confirmLabel: 'Delete',
  danger: true,
});
```

### Modal types & panel classes
| Type | Panel class | Behaviour |
|------|-------------|-----------|
| `center` | `modal-panel--center` | Centered dialog, max 560 px, fade+scale in |
| `drawer` | `modal-panel--drawer` | Slides in from right, full height, max 480 px |
| `confirm` | `modal-panel--confirm` | Centered, compact (400 px), used by `confirm()` |

### ModalShellComponent
Reusable layout shell. Use it inside every new modal component.

```html
<app-modal-shell [title]="'My Modal'" [subtitle]="'Optional'" (close)="close()">
  <!-- body content via ng-content -->
  <p>Modal body goes here.</p>

  <!-- optional footer via named template -->
  <ng-template #footer>
    <button (click)="cancel()">Cancel</button>
    <button (click)="save()">Save</button>
  </ng-template>
</app-modal-shell>
```

Inputs: `title` (string), `subtitle` (string)  
Outputs: `close` (void) — emit to close the dialog  
Footer: provide `<ng-template #footer>` as content child

### Reading injected data inside a modal component

```ts
import { inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../core/modal/modal.types';

export class MyModalComponent {
  private dialogRef = inject(DialogRef<MyResultType>);
  readonly data = inject<MyDataType>(MODAL_DATA);

  close(result?: MyResultType): void {
    this.dialogRef.close(result);
  }
}
```

### Creating a new modal — checklist
1. Create component in `src/app/shared/components/ui/modal/<name>/` — always, even for domain-specific modals (they may be reused from other pages)
2. Use `ModalShellComponent` in the template
3. Inject `DialogRef` and `MODAL_DATA` as needed
4. Open it via `ModalService.open(MyModalComponent, { type, data })`
5. **Do NOT** add CDK overlay styles inside the component's SCSS — use `src/styles/_modal.scss`

---

## Toast System

### Overview
Global toast notifications. The `<app-toast />` component is mounted once in `src/app/app.html` — never add it elsewhere.

### Key files
| File | Role |
|------|------|
| `src/app/shared/components/ui/toast/toast.service.ts` | `ToastService` — inject and call directly |
| `src/app/shared/components/ui/toast/toast.model.ts` | `Toast`, `ToastType`, `ToastOptions` types |
| `src/app/shared/components/ui/toast/toast.component.ts` | Renders the toast queue (already in app root) |

### ToastService API

```ts
private toast = inject(ToastService);

this.toast.success('Apiary created.');
this.toast.error('Something went wrong. Please try again.');
this.toast.warning('Name already exists.');
this.toast.info('Changes saved.');

// With options
this.toast.error('Critical error', { title: 'Save failed', duration: 0 }); // persistent
```

### ToastOptions
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | — | Optional bold title above the message |
| `duration` | number (ms) | 4000 | `0` = persistent (no auto-dismiss) |
| `closable` | boolean | true | Show × button |

### Rules
- **Never** use `notification` state or native `alert()`/`confirm()` — use `ToastService` and `ModalService.confirm()` respectively.
- Errors from API calls → `toast.error(...)`, success → `toast.success(...)`.

---

## Card Component

### Overview
Reusable panel/card UI component. CSS custom properties are defined globally in `src/styles/_card.scss` so they can be overridden at any DOM scope.

### Key files
| File | Role |
|------|------|
| `src/app/shared/components/ui/card/card.ts` | `CardComponent` |
| `src/app/shared/components/ui/card/card.html` | Template |
| `src/app/shared/components/ui/card/card.scss` | Component styles (uses CSS vars) |
| `src/styles/_card.scss` | Global CSS var definitions (imported in `styles.scss`) |

### Usage

```html
<!-- Basic -->
<app-card title="Apiaries">
  <button card-header-end (click)="add()">+ Add</button>
  <!-- body content -->
</app-card>

<!-- Map/flush variant (no body padding, body fills height) -->
<app-card title="Location" [flush]="true" height="560px">
  <span card-header-end>extra header content</span>
  <div class="my-fill-content">...</div>
</app-card>

<!-- With footer -->
<app-card title="Settings">
  <p>Body</p>
  <ng-template #cardFooter>
    <button>Save</button>
  </ng-template>
</app-card>
```

### Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | string | `''` | Card header title (hidden if empty) |
| `flush` | boolean | `false` | Removes body padding; body becomes flex column (use for maps/tables that must fill edge-to-edge) |
| `height` | string | `''` | Explicit height on the inner `.card` div (e.g. `'560px'`) |

### Content slots
- `[card-header-end]` — projected into the right side of the header
- Default `ng-content` — projected into the body
- `<ng-template #cardFooter>` — projected into a footer bar

### CSS custom properties (override at any scope)

| Variable | Default | Description |
|----------|---------|-------------|
| `--card-bg` | `#ffffff` | Background |
| `--card-border` | `#e5e5e5` | Border + divider color |
| `--card-radius` | `8px` | Border radius |
| `--card-shadow` | `0 1px 3px rgba(0,0,0,.08)` | Box shadow |
| `--card-title-color` | `#737373` | Header title color |
| `--card-title-size` | `0.9rem` | Header title font size |

---

## Map Picker Component

### Overview
Reusable Google Maps component that wraps script loading, marker display, and click-to-place interaction. A singleton `GoogleMapsLoaderService` loads the script once globally — any number of `MapPickerComponent` instances share the same loaded state.

### Key files
| File | Role |
|------|------|
| `src/app/core/services/google-maps-loader.service.ts` | Loads Maps script once; exposes `mapsLoaded` signal |
| `src/app/shared/components/ui/map-picker/map-picker.ts` | `MapPickerComponent` |
| `src/app/shared/components/ui/map-picker/map-picker.html` | Template (map or loading placeholder) |
| `src/app/shared/components/ui/map-picker/map-picker.scss` | `:host { display: block; width/height: 100% }` |

### Usage

```html
<!-- Fills its container; parent controls size -->
<div class="my-map-wrapper">
  <app-map-picker
    [marker]="markerPosition"
    (markerChange)="markerPosition = $event" />
</div>

<!-- With explicit center + zoom (e.g. pan to selected row) -->
<app-map-picker
  [center]="mapCenter"
  [zoom]="mapZoom"
  [marker]="markerPosition"
  (markerChange)="markerPosition = $event" />

<!-- Read-only (no click-to-place) -->
<app-map-picker [marker]="location" [interactive]="false" />
```

The component calls `GoogleMapsLoaderService.load()` on `ngOnInit`. **Never** call `loadMapsScript` manually or manage `mapsLoaded` in parent components.

### Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `center` | `LatLngLiteral` | Athens `{37.9838, 23.7275}` | Map center |
| `zoom` | number | `6` | Map zoom level |
| `marker` | `LatLngLiteral \| null` | `null` | Marker position (parent-controlled) |
| `interactive` | boolean | `true` | Whether clicks emit `markerChange` |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `markerChange` | `LatLngLiteral` | Emits on map click (only when `interactive=true`) |

### Sizing
The component host is `display: block; width: 100%; height: 100%` — size it from the parent:
```scss
.my-map-wrapper {
  height: 300px;          // or flex: 1, etc.
  border-radius: 8px;
  overflow: hidden;
}
```

---

## Data Table Component

### Overview
Generic, presentational table used across nearly every list/CRUD feature. Renders columns + rows and projects custom cell/edit/action templates. Pagination is parent-controlled (emits page changes; it does not fetch).

### Key files
`src/app/shared/components/ui/data-table/data-table.ts` — `DataTableComponent<T>`, plus the exported `ColumnDef` and `TablePagination` interfaces (imported directly by feature components).

```ts
export interface ColumnDef { key: string; label: string; width?: string; }
export interface TablePagination { page: number; totalPages: number; total: number; }
```

### Usage
```html
<app-data-table
  [columns]="columns"
  [rows]="rows()"
  [loading]="loading()"
  [pagination]="tablePagination"
  (pageChange)="goToPage($event)"
  (rowClick)="open($event)">

  <!-- optional custom cell rendering -->
  <ng-template #cellTpl let-row="row" let-col="col"> ... </ng-template>
  <!-- optional inline-edit row (paired with an `editingId`) -->
  <ng-template #editRowTpl let-row="row"> ... </ng-template>
  <!-- optional per-row action buttons -->
  <ng-template #actionsTpl let-row="row">
    <button (click)="startEdit(row)">Edit</button>
    <button (click)="deleteRow(row)">Delete</button>
  </ng-template>
</app-data-table>
```

### Inputs
| Input | Type | Default | Notes |
|-------|------|---------|-------|
| `columns` *(required)* | `ColumnDef[]` | — | Column definitions |
| `rows` *(required)* | `T[]` | — | Row data |
| `editingId` | `number \| null` | `null` | Row id currently in inline-edit mode (renders `editRowTpl`) |
| `pagination` | `TablePagination \| null` | `null` | `null` hides the pager |
| `loading` | boolean | `false` | Shows loading state |
| `emptyMessage` | string | `'No records found.'` | Shown when `rows` empty |
| `showActions` | boolean | `true` | Toggles the actions column |
| `clickableRows` | boolean | `false` | Emit `rowClick` on row click |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `pageChange` | `number` | New page requested (parent updates its `page` signal + refetches/slices) |
| `rowClick` | `T` | Emitted when `clickableRows` and a row is clicked |

### Content templates
`#cellTpl`, `#editRowTpl`, `#actionsTpl` — projected via `@ContentChild`. Uses `ViewEncapsulation.None` (styles are global).

> Pagination can be **client-side** (parent `computed` slices `rows` — see `apiary.ts`) or **server-side** (parent refetches on `pageChange` — see `admin/raw-data`).

---

## Filter Bar Component

### Overview
Apiary + beehive selector used at the top of record list pages (inspections, feeding, harvest, dashboard, beehives). Pure presentational; uses signal `model()` two-way bindings.

### Key file
`src/app/shared/components/ui/filter-bar/filter-bar.ts` — `FilterBarComponent`.

### Usage
```html
<app-filter-bar
  [apiaries]="apiaries()"
  [beehives]="beehives()"
  [apiaryId]="selectedApiaryId()"
  (apiaryIdChange)="onApiaryChange($event)"
  [beehiveId]="selectedBeehiveId()"
  (beehiveIdChange)="onBeehiveChange($event)" />
```

### API
| Member | Type | Notes |
|--------|------|-------|
| `apiaries` | `input<Apiary[]>` | Options for the apiary select |
| `beehives` | `input<Beehive[]>` | Options for the beehive select |
| `apiaryId` | `model<number>` | Two-way; **`0` = "all"** |
| `beehiveId` | `model<number>` | Two-way; **`0` = "all"** |

> Convention: `0` means "no filter / all". Parents keep `selectedApiaryId` / `selectedBeehiveId` signals and derive the visible list with a `computed` (the "records" pattern — see [`inspections/CLAUDE.md`](src/app/features/user/inspections/CLAUDE.md)).
