import { FieldOption } from './form-fields.model';
import { Observable } from 'rxjs';
import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';

export interface DynamicField {
  name: string;
  type:
    | 'text'
    | 'number'
    | 'select'
    | 'email'
    | 'password'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'date'
    | 'range'
    | 'toggle'
    | 'map';
  label: string;
  isMultiple?: boolean;
  placeholder?: string;
  options?: Observable<FieldOption[]> | ((value: unknown) => Observable<FieldOption[]>);
  cascadeFrom?: string;
  value?: unknown;
  syncValidators?: ValidatorFn[];
  asyncValidators?: AsyncValidatorFn[];
  conditions?: {
    disabled?: FieldCondition[];
    visible?: FieldCondition[];
    required?: FieldCondition[];
  };
  size: 'full' | 'half' | 'third' | 'two-thirds';
}

export interface FieldCondition {
  triggerField: string;
  triggerValue: unknown;
  operator?:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'greaterThanOrEqual'
    | 'lessThanOrEqual'
    | 'notIncludes'
    | 'empty'
    | 'notEmpty'
    | 'lessThan'
    | 'includes'
    | 'custom';
  targetFields: string[];
  action: 'disable' | 'enable' | 'show' | 'hide' | 'clear';
}
