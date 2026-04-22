import { Injectable } from '@angular/core';
import { FormControl, FormGroup, UntypedFormBuilder } from '@angular/forms';
import { DynamicField } from '../models/form.model';
import { syncValidators } from '../../shared/components/ui/form/validators.config';

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'includes'
  | 'notIncludes'
  | 'empty'
  | 'notEmpty'
  | 'custom';

export type ConditionAction =
  | 'disable'
  | 'enable'
  | 'show'
  | 'hide'
  | 'clear'
  | 'required'
  | 'optional';

@Injectable({
  providedIn: 'root',
})
export class FormManagementService {
  constructor(private fb: UntypedFormBuilder) {}

  getDynamicForm(fields: DynamicField[]): FormGroup {
    const group: any = {};
    fields.forEach(f => {
      group[f.name] = new FormControl(
        {
          value: this.getRightFormControlValue(f),
          disabled: this.getInitialFieldDisabledStatus(f, fields),
        },
        {
          validators: f.syncValidators || [],
          asyncValidators: f.asyncValidators || [],
        },
      );
    });
    return new FormGroup(group);
  }

  private getRightFormControlValue(field: DynamicField): any {
    if (field.type === 'date') return field.value?.split('T')[0] || '';
    return field.value ?? null;
  }

  private getInitialFieldDisabledStatus(field: DynamicField, formFields: DynamicField[]): boolean {
    const triggerField = formFields.find(
      f => f.name === field.conditions?.disabled?.[0].triggerField,
    );

    if (!triggerField) return false;
    if (!field?.conditions?.disabled?.[0]) return false;

    return this.evaluateCondition(
      field.conditions?.disabled[0]?.operator ?? 'equals',
      field.conditions?.disabled[0].triggerValue,
      triggerField.value,
    );
  }

  disableFieldsIfNeeded(form: FormGroup, fields: DynamicField[]): void {
    fields.forEach(f => {
      const triggerField = f.conditions?.disabled?.[0].triggerField;

      if (!triggerField) return;
      const formControl = form.get(triggerField);
      if (!formControl) return;
      if (!f.conditions?.disabled?.[0]) return;

      if (
        this.evaluateCondition(
          f.conditions?.disabled[0]?.operator ?? 'equals',
          formControl.value,
          form.get(f.name)?.value,
        )
      ) {
        formControl.setValue(null, { emitEvent: false });
        formControl.disable({ emitEvent: false });
      } else {
        formControl.enable({ emitEvent: false });
      }
    });
  }

  private evaluateCondition(operator: ConditionOperator, value: any, triggerValue: any): boolean {
    switch (operator) {
      case 'equals':            return triggerValue === value;
      case 'notEquals':         return triggerValue !== value;
      case 'greaterThan':       return Number(triggerValue) > Number(value);
      case 'lessThan':          return Number(triggerValue) < Number(value);
      case 'greaterThanOrEqual': return Number(triggerValue) >= Number(value);
      case 'lessThanOrEqual':   return Number(triggerValue) <= Number(value);
      case 'includes':          return Array.isArray(triggerValue) && triggerValue.includes(value);
      case 'notIncludes':       return Array.isArray(triggerValue) && !triggerValue.includes(value);
      case 'empty':             return !!triggerValue;
      case 'notEmpty':          return triggerValue !== null && triggerValue !== undefined && triggerValue !== '';
      default:                  return triggerValue === value;
    }
  }

  getRangeFormFieldForm(): FormGroup {
    return this.fb.group({
      minValue: [null, []],
      maxValue: [null, []],
    });
  }
}
