import {
  AfterViewInit,
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

@Component({
  selector: 'app-form-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
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
export class InputComponent implements ControlValueAccessor, AfterViewInit {
  @Input() label!: string;
  @Input() inputType: 'text' | 'number' | 'email' | 'password' | 'date' = 'text';
  @Input() placeholder: string = '';
  @Input() displayErrors: boolean = true;
  @Input() autocomplete!: string;
  @Input() noSpinners: boolean = false;

  @Output() inputChanged = new EventEmitter<any>();
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  protected value: string | number = '';
  protected disabled: boolean = false;
  isPasswordVisible: boolean = false;
  saFormControlName?: SAFormControlNameDirective | null;

  constructor(private injector: Injector) {
    queueMicrotask((): void => {
      this.saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    });
  }

  ngAfterViewInit(): void {}

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value !== undefined) this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
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
