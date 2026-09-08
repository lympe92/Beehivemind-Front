import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Injector,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';

/** The workhorse text field. Styles: `.form-group` / `.form-control` in styles/components/forms/forms.css. */
@Component({
  selector: 'app-form-input',
  templateUrl: './input.component.html',
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
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent],
})
export class InputComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() inputType: 'text' | 'number' | 'email' | 'password' | 'date' = 'text';
  @Input() placeholder: string = '';
  @Input() displayErrors: boolean = true;
  @Input() autocomplete!: string;
  @Input() noSpinners: boolean = false;

  @Output() inputChanged = new EventEmitter<string | number>();
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  protected value: string | number = '';
  protected disabled: boolean = false;
  isPasswordVisible: boolean = false;
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
    if (value !== undefined) this.value = (value as string | number) ?? '';
  }

  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  onBlur(): void { this.onTouched(); }

  onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.value = this.inputType === 'number' ? +inputElement.value : inputElement.value;
    this.onChange(this.value);
    this.inputChanged.emit(this.value);
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

  get type(): string {
    if (this.inputType === 'password') return this.isPasswordVisible ? 'text' : 'password';
    return this.inputType;
  }

  showPassword(): void { this.isPasswordVisible = true; }
  hidePassword(): void { this.isPasswordVisible = false; }
}
