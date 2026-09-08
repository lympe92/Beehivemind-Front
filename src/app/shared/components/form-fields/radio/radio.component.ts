import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { FieldOption } from '../../../../core/models/form-fields.model';

let radioGroupSeq = 0;

/**
 * A radio group. The native input is the control — it takes the accent through
 * `accent-color` in styles/components/forms/forms.css. Pass `name` when more
 * than one group shares a form; otherwise one is generated.
 */
@Component({
  selector: 'app-form-radio',
  templateUrl: './radio.component.html',
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
      useExisting: forwardRef(() => RadioComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class RadioComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() options!: FieldOption[];
  @Input() direction: 'row' | 'column' = 'row';
  @Input() name?: string;

  value!: string | number | boolean | null;
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
  private readonly generatedName = `radio-group-${++radioGroupSeq}`;

  get groupName(): string {
    return this.name || this.generatedName;
  }

  constructor(private injector: Injector) {
  }

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void { this.value = value; }
  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onUpdateValue(id: string | number | boolean | null): void {
    if (this.disabled) return;
    this.value = id;
    this.onChange(this.value);
    this.onTouched();
  }

  isFieldValid(): boolean {
    if (!this.saFormControlName?.errors) return false;
    return !this.saFormControlName.valid && !!this.saFormControlName.touched;
  }

  get isRequired(): boolean {
    const control = this.saFormControlName?.control;
    if (!control?.validator) return false;
    const errors = control.validator(new FormControl(''));
    return errors?.['required'] !== undefined;
  }
}
