import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './textarea.component.html',
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
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() rows: number = 4;

  value: string = '';
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

  writeValue(value: unknown): void {
    if (value !== undefined) this.value = (value as string) ?? '';
  }

  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(event: Event): void {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.onChange(this.value);
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
