# beehivemind-Front — Claude Guide

## Tech Stack
- Angular (standalone components, signals)
- Angular CDK (`@angular/cdk/dialog`) for overlays

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
