import {
  Component,
  EventEmitter,
  forwardRef,
  Injector,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { FormManagementService } from '../../../../core/services/forms-management.service';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'app-form-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
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
      useExisting: forwardRef(() => RangeComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent, ReactiveFormsModule, InputComponent, FormsModule],
})
export class RangeComponent implements OnInit, ControlValueAccessor {
  @Input() label!: string;
  @Input() min = 0;
  @Input() max = 1000;
  @Input() step = 10;

  rangeForm!: FormGroup;

  @Output() inputChanged = new EventEmitter<any>();

  protected value: string | number = '';
  protected disabled: boolean = false;
  saFormControlName?: SAFormControlNameDirective | null;

  constructor(
    private injector: Injector,
    private formManagementService: FormManagementService,
  ) {
    queueMicrotask((): void => {
      this.saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    });
  }

  ngOnInit(): void {
    this.rangeForm = this.formManagementService.getRangeFormFieldForm();

    this.rangeForm.valueChanges.subscribe(x => {
      const { minValue, maxValue } = x;
      if (minValue > maxValue) {
        this.rangeForm.patchValue({ maxValue: minValue }, { emitEvent: false });
      }
      if (maxValue < minValue) {
        this.rangeForm.patchValue({ minValue: maxValue }, { emitEvent: false });
      }
    });
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value !== undefined) this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

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
