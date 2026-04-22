# Dynamic Form System

Schema-driven reactive form system. Define fields as a config array → get a fully wired `FormGroup` with validation, conditional logic, and a rendered form UI.

---

## Key files

| File | Role |
|------|------|
| `src/app/core/models/form.model.ts` | `DynamicField` interface — field config shape |
| `src/app/core/models/form-fields.model.ts` | `FieldOption` — option shape for select/radio/checkbox |
| `src/app/core/models/validators.model.ts` | `ValidatorConfig`, `SyncValidators` types |
| `src/app/core/directives/dynamic-field.directive.ts` | `SAFormControlNameDirective` — bridges CVA components with reactive forms |
| `src/app/core/services/forms-management.service.ts` | `FormManagementService` — builds `FormGroup`, handles conditions |
| `src/app/core/services/form-fields.service.ts` | Helpers for select field option handling |
| `src/app/shared/components/ui/form/form.component.ts` | `FormComponent` — renders fields + submit button |
| `src/app/shared/components/ui/form/validators.config.ts` | All validator factories (sync, async, cross-field) |
| `src/app/shared/components/form-fields/` | Individual field components (input, textarea, select, radio, checkboxes, range, errors) |

---

## DynamicField config

```ts
import { DynamicField } from 'src/app/core/models/form.model';

const fields: DynamicField[] = [
  {
    name: 'email',           // FormControl key
    type: 'email',           // field component to render
    label: 'Email',
    size: 'full',            // 'full' | 'half' | 'third' | 'two-thirds'
    defaultValue: '',
    validators: [
      { type: 'required' },
      { type: 'email' },
    ],
  },
  {
    name: 'age',
    type: 'number',
    label: 'Age',
    size: 'half',
    defaultValue: null,
    validators: [{ type: 'rangeNumber', params: { min: 18, max: 120 } }],
  },
  {
    name: 'role',
    type: 'select',
    label: 'Role',
    size: 'half',
    options: of([                          // Observable<FieldOption[]>
      { displayValue: 'Admin', returnValue: 'admin' },
      { displayValue: 'User',  returnValue: 'user'  },
    ]),
    isMultiple: false,
  },
];
```

### Field types

| `type` | Component rendered |
|--------|--------------------|
| `text` | `app-form-input` |
| `number` | `app-form-input` (type=number) |
| `email` | `app-form-input` (type=email) |
| `password` | `app-form-input` (type=password) |
| `date` | `app-form-input` (type=date) |
| `textarea` | `app-form-textarea` |
| `select` | `app-form-select` |
| `radio` | `app-form-radio` |
| `checkbox` | `app-form-checkboxes` |
| `range` | `app-form-range` |

---

## FormComponent usage

### Standalone (emits form value on submit)

```html
<app-form
  [fields]="myFields"
  submitLabel="Save"
  [loading]="isSaving"
  (submitForm)="onSubmit($event)"
/>
```

```ts
onSubmit(value: Record<string, any>): void {
  // value contains all field values keyed by field.name
}
```

### Inside a modal (most common pattern)

```ts
// parent component
private modal = inject(ModalService);

async openMyModal(): Promise<void> {
  const result = await this.modal.open(MyFormModalComponent, {
    type: 'center',
    data: { /* optional data */ },
  });
  if (result) {
    // result is the raw form value
  }
}
```

```ts
// MyFormModalComponent
export class MyFormModalComponent {
  private dialogRef = inject(DialogRef<any>);
  readonly data = inject<MyDataType>(MODAL_DATA);

  fields: DynamicField[] = [ /* ... */ ];

  onSubmit(value: any): void {
    this.dialogRef.close(value);   // passes form value back to caller
  }
}
```

```html
<!-- MyFormModalComponent template -->
<app-modal-shell title="My Form" (close)="dialogRef.close()">
  <app-form [fields]="fields" (submitForm)="onSubmit($event)" />
</app-modal-shell>
```

---

## Available validators

Defined in `validators.config.ts`, referenced via `ValidatorConfig` in `DynamicField.validators`.

### Sync validators

| `type` | `params` | Description |
|--------|----------|-------------|
| `required` | — | Field must have a value |
| `email` | — | Valid email format |
| `minLength` | `min: number` | Minimum character count |
| `maxLength` | `max: number` | Maximum character count |
| `number` | — | Value must be a number |
| `rangeNumber` | `{ min, max }` | Value within numeric range |

### Async validators

| `type` | `params` | Description |
|--------|----------|-------------|
| `apiValidator` | `{ urlPath, mapperRes }` | Hits `GET /api/{urlPath}/{value}`, validates via `mapperRes` |

### Cross-field validators

Applied to a field that depends on another field's value in the same form.

| `type` | `params` | Description |
|--------|----------|-------------|
| `lessThan` | `maxFieldName` | This value < other field |
| `lessThanOrEqual` | `maxFieldName` | This value ≤ other field |
| `greaterThan` | `minFieldName` | This value > other field |
| `greaterThanOrEqual` | `minFieldName` | This value ≥ other field |
| `equalTo` | `targetFieldName` | Must equal other field |
| `notEqualTo` | `targetFieldName` | Must differ from other field |
| `notEmpty` | `targetFieldName` | Other field must be valid + non-empty |

---

## Conditional fields

A field can be shown/disabled based on another field's value via `conditions`.

```ts
{
  name: 'source_beekeeper',
  type: 'text',
  label: 'Beekeeper name',
  conditions: [
    {
      dependsOn: 'source',      // watch this control
      value: 'purchased',       // when it equals this
      action: 'show',           // 'show' | 'disable'
    },
  ],
}
```

`FormManagementService.disableFieldsIfNeeded()` evaluates conditions on every `valueChanges` emission. The `FormComponent` wires this automatically — no extra setup needed.

---

## FieldOption shape

Used by `select`, `radio`, and `checkbox` fields.

```ts
interface FieldOption {
  displayValue: string;             // label shown in UI
  dropdownDisplayValue?: string;    // override label inside dropdown
  returnValue: any;                 // value written to FormControl
  searchableValues?: string[];      // extra strings for search matching
}
```

---

## SAFormControlNameDirective

Internal directive (`src/app/core/directives/dynamic-field.directive.ts`). Applied via `hostDirectives` on every field component — do not use it directly. It extends Angular's `FormControlName` to expose the parent `FormGroupDirective` to ControlValueAccessor-based custom components.

---

## Adding a new field type

1. Create `src/app/shared/components/form-fields/<name>/<name>.component.ts`
   - Implement `ControlValueAccessor`
   - Add `SAFormControlNameDirective` in `hostDirectives`
   - Register `NG_VALUE_ACCESSOR`
2. Add the new `type` literal to `DynamicField['type']` in `form.model.ts`
3. Import and render it in `form.component.html` with `@if (field.type === '<name>')`
4. Import the component in `form.component.ts`
