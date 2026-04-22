import { FieldOption } from './form-fields.model';
import { Observable } from 'rxjs';

export interface DynamicField<T = any> {
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
  options?: Observable<FieldOption[]> | ((value: any) => Observable<FieldOption[]>);
  cascadeFrom?: string;
  value?: any;
  syncValidators?: any[];
  asyncValidators?: any[];
  conditions?: {
    disabled?: FieldCondition[];
    visible?: FieldCondition[];
    required?: FieldCondition[];
  };
  size: 'full' | 'half' | 'third' | 'two-thirds';
}

export interface FieldCondition {
  triggerField: string;
  triggerValue: any;
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
