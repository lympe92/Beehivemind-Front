import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { FieldOption } from '../../../../core/models/form-fields.model';

@Component({
  selector: 'app-form-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss'],
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
  @Input() direction: 'row' | 'column' = 'column';

  value!: string | number | boolean | null;
  disabled: boolean = false;
  saFormControlName?: SAFormControlNameDirective | null;

  constructor(private injector: Injector) {
    queueMicrotask((): void => {
      this.saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    });
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void { this.value = value; }
  registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onUpdateValue(id: string | number | boolean | null): void {
    this.value = this.value !== id ? id : null;
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