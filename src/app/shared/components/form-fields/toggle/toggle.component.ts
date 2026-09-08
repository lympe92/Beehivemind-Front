import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';

/** A switch, label on the right. The whole row is the hit target. */
@Component({
  selector: 'app-form-toggle',
  templateUrl: './toggle.component.html',
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
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() hint?: string;

  protected checked = false;
  protected disabled = false;
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

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (value: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.onTouched();
  }

  get isRequired(): boolean {
    const control = this.saFormControlName?.control;
    if (!control?.validator) return false;
    const errors = control.validator(new FormControl(''));
    return errors?.['required'] !== undefined;
  }

  isFieldValid(): boolean {
    if (!this.saFormControlName?.errors) return false;
    const hasErrors = Object.entries(this.saFormControlName.errors).some(([, v]) => v !== false);
    return hasErrors && !this.saFormControlName.valid && !!this.saFormControlName.touched;
  }
}
