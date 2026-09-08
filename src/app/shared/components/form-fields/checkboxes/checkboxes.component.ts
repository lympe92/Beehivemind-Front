import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { FieldOption } from '../../../../core/models/form-fields.model';

/**
 * A group of checkboxes under one label with one shared error slot. The value
 * is an array of `returnValue`s. The native input is the control.
 */
@Component({
  selector: 'app-form-checkboxes',
  templateUrl: './checkboxes.component.html',
  standalone: true,
  hostDirectives: [
    {
      directive: SAFormControlNameDirective,
      inputs: ['formControlName'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxesComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class CheckboxesComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() options!: FieldOption[];
  @Input() direction: 'row' | 'column' = 'column';

  value!: (string | number | boolean | null)[];
  disabled: boolean = false;
  private _saFormControlName?: SAFormControlNameDirective | null;
  /** The host FormControlName, resolved on first use: it cannot be injected during construction,
   *  and resolving it in a microtask left the required marker unrendered under OnPush. */
  get saFormControlName(): SAFormControlNameDirective | null {
    if (this._saFormControlName === undefined) {
      this._saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    }
    return this._saFormControlName;
  }
  constructor(private injector: Injector) {
  }

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string[]): void { this.value = value; }
  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onToggleOption(returnValue: string | boolean | number | null): void {
    if (this.disabled) return;
    this.value = this.updateValue(returnValue);
    this.onChange(this.value);
    this.onTouched();
  }

  private updateValue(returnValue: string | boolean | number | null): (string | number | boolean | null)[] {
    if (!this.value) return [returnValue];
    return this.value.includes(returnValue)
      ? this.value.filter(x => x !== returnValue)
      : [...this.value, returnValue];
  }

  isChecked(option: string | boolean | number | null): boolean {
    return option !== null && option !== undefined ? !!this.value?.includes(option) : false;
  }

  isFieldValid(): boolean {
    if (!this.saFormControlName?.errors) return false;
    const hasErrors = Object.entries(this.saFormControlName.errors).some(([, v]) => v !== false);
    return hasErrors && !this.saFormControlName.valid && !!this.saFormControlName.touched;
  }

  get isRequired(): boolean {
    const control = this.saFormControlName?.control;
    if (!control?.validator) return false;
    const errors = control.validator(new FormControl(''));
    return errors?.['required'] !== undefined;
  }
}
