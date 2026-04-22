# Dynamic Form System

Schema-driven reactive form system. Define fields as a config array → get a fully wired `FormGroup` with validation, conditional logic, and a rendered form UI.

---

## Key files

| File | Role |
|------|------|
| `src/app/core/models/form.model.ts` | `DynamicField`, `FieldCondition` interfaces |
| `src/app/core/models/form-fields.model.ts` | `FieldOption` — option shape for select/radio/checkbox |
| `src/app/core/directives/dynamic-field.directive.ts` | `SAFormControlNameDirective` — bridges CVA components with reactive forms |
| `src/app/core/services/forms-management.service.ts` | `FormManagementService` — builds `FormGroup`, handles conditions |
| `src/app/shared/components/ui/form/form.component.ts` | `FormComponent` — renders fields + submit button |
| `src/app/shared/components/ui/form/validators.config.ts` | Validator factories: `syncValidators`, `asyncValidators`, `crossFieldValidators` |
| `src/app/shared/components/form-fields/` | Individual field components |

---

## DynamicField config

```ts
import { DynamicField } from 'src/app/core/models/form.model';
import { syncValidators } from 'src/app/shared/components/ui/form/validators.config';
import { of } from 'rxjs';

const fields: DynamicField[] = [
  {
    name: 'email',           // FormControl key
    type: 'email',           // field component to render
    label: 'Email',
    size: 'full',            // 'full' | 'half' | 'third' | 'two-thirds'
    value: '',               // initial value (was `defaultValue` in older version)
    syncValidators: [
      syncValidators.required(),
      syncValidators.email(),
    ],
  },
  {
    name: 'age',
    type: 'number',
    label: 'Age',
    size: 'half',
    value: null,
    syncValidators: [syncValidators.rangeNumber({ min: 18, max: 120 })],
  },
  {
    name: 'role',
    type: 'select',
    label: 'Role',
    size: 'half',
    value: null,
    options: of([                         // Observable<FieldOption[]>
      { displayValue: 'Admin', returnValue: 'admin' },
      { displayValue: 'User',  returnValue: 'user'  },
    ]),
    isMultiple: false,
  },
];
```

### DynamicField interface

```ts
interface DynamicField {
  name: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'textarea'
      | 'select' | 'radio' | 'checkbox' | 'range' | 'toggle' | 'map';
  label: string;
  size: 'full' | 'half' | 'third' | 'two-thirds';
  value?: any;                                           // initial form value
  syncValidators?: ValidatorFn[];                        // array of sync validator functions
  asyncValidators?: AsyncValidatorFn[];                  // array of async validator functions
  placeholder?: string;
  isMultiple?: boolean;                                  // select: allow multiple selection
  options?: Observable<FieldOption[]>
          | ((value: any) => Observable<FieldOption[]>); // function form = cascading select
  cascadeFrom?: string;                                  // control name to watch for cascading
  conditions?: {
    disabled?: FieldCondition[];   // implemented
    visible?: FieldCondition[];    // defined but NOT yet implemented
    required?: FieldCondition[];   // defined but NOT yet implemented
  };
}
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
| `toggle` | `app-form-toggle` — boolean on/off switch |
| `map` | `app-form-map` — Google Maps picker, value is `LatLngLiteral \| null` |

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
  // only called when form.valid is true
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
  protected dialogRef = inject(DialogRef<any>);
  readonly data = inject<MyDataType>(MODAL_DATA);

  readonly fields: DynamicField[] = [ /* ... */ ];

  onSubmit(value: any): void {
    this.dialogRef.close(value);   // passes form value back to caller
  }
}
```

```html
<!-- MyFormModalComponent template -->
<app-modal-shell title="My Form" (close)="dialogRef.close()">
  <app-form [fields]="fields" submitLabel="Save" (submitForm)="onSubmit($event)" />
</app-modal-shell>
```

---

## Available validators

Import from `src/app/shared/components/ui/form/validators.config.ts`. Call the factory to get the validator function.

### syncValidators

| Factory | Usage | Description |
|---------|-------|-------------|
| `required` | `syncValidators.required()` | Field must have a value |
| `email` | `syncValidators.email()` | Valid email format |
| `minLength` | `syncValidators.minLength(3)` | Minimum character count |
| `maxLength` | `syncValidators.maxLength(100)` | Maximum character count |
| `number` | `syncValidators.number()` | Value must be a number type |
| `rangeNumber` | `syncValidators.rangeNumber({ min, max })` | Value within numeric range — passes if null |

### asyncValidators

| Factory | Usage | Description |
|---------|-------|-------------|
| `apiValidator` | `asyncValidators.apiValidator(http, '/path', res => !!res.ok)` | Hits `GET /api/{path}/{value}`, validates via mapper |

### crossFieldValidators

Applied to a field that depends on another field's value.

| Factory | Usage | Description |
|---------|-------|-------------|
| `lessThan` | `crossFieldValidators.lessThan('maxField')` | value < other field |
| `lessThanOrEqual` | `crossFieldValidators.lessThanOrEqual('maxField')` | value ≤ other field |
| `greaterThan` | `crossFieldValidators.greaterThan('minField')` | value > other field |
| `greaterThanOrEqual` | `crossFieldValidators.greaterThanOrEqual('minField')` | value ≥ other field |
| `equalTo` | `crossFieldValidators.equalTo('targetField')` | Must equal other field |
| `notEqualTo` | `crossFieldValidators.notEqualTo('targetField')` | Must differ from other field |
| `notEmpty` | `crossFieldValidators.notEmpty('targetField')` | Other field must be valid + non-empty |

---

## Cascading selects

When a select's options depend on another field's value, pass `options` as a function and `cascadeFrom` as the controlling field name. The field updates its options automatically whenever the source changes.

```ts
{
  name: 'apiary_id',
  type: 'select',
  label: 'Apiary',
  size: 'half',
  value: null,
  syncValidators: [syncValidators.required()],
  options: of(apiaries.map(a => ({ displayValue: a.name, returnValue: a.id }))),
},
{
  name: 'beehive_id',
  type: 'select',
  label: 'Beehive',
  size: 'half',
  value: null,
  cascadeFrom: 'apiary_id',
  options: (apiaryId: number) => of(
    beehives
      .filter(b => b.apiaryId === apiaryId)
      .map(b => ({ displayValue: b.name, returnValue: b.id })),
  ),
},
```

---

## Conditional fields

A field can be disabled/enabled based on another field's value via `conditions.disabled`. Only the `disabled` category is currently implemented in `FormManagementService`.

```ts
{
  name: 'beehive_id',
  type: 'select',
  label: 'Beehive',
  conditions: {
    disabled: [
      {
        triggerField: 'apiary_id',     // watch this control
        triggerValue: null,            // when it equals this value
        operator: 'equals',            // comparison operator
        targetFields: ['beehive_id'],  // fields affected
        action: 'disable',
      },
    ],
  },
}
```

### FieldCondition shape

```ts
interface FieldCondition {
  triggerField: string;
  triggerValue: any;
  operator?: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual'
           | 'lessThan' | 'lessThanOrEqual' | 'includes' | 'notIncludes'
           | 'empty' | 'notEmpty' | 'custom';
  targetFields: string[];
  action: 'disable' | 'enable' | 'show' | 'hide' | 'clear';
}
```

---

## FieldOption shape

Used by `select`, `radio`, and `checkbox` fields.

```ts
interface FieldOption {
  displayValue: string;             // label shown in UI
  dropdownDisplayValue?: string;    // override label inside dropdown
  returnValue: any;                 // value written to FormControl (type preserved)
  searchableValues?: string[];      // extra strings for search matching
}
```

---

## SAFormControlNameDirective

Internal directive (`src/app/core/directives/dynamic-field.directive.ts`). Applied via `hostDirectives` on every field component — do not use it directly.

---

## Adding a new field type

1. Create `src/app/shared/components/form-fields/<name>/<name>.component.ts`
   - Implement `ControlValueAccessor`
   - Add `SAFormControlNameDirective` in `hostDirectives`
   - Register `NG_VALUE_ACCESSOR`
2. Add the new `type` literal to `DynamicField['type']` in `form.model.ts`
3. Import and render it in `form.component.html` with `@if (field.type === '<name>')`
4. Import the component in `form.component.ts`
