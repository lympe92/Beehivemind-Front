import {
  Component,
  DestroyRef,
  EventEmitter,
  forwardRef,
  Injector,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

/** A min/max filter: two number fields over a dual-thumb track. Styles in forms.css. */
@Component({
  selector: 'app-form-range',
  templateUrl: './range.component.html',
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

  @Output() inputChanged = new EventEmitter<string | number>();

  protected disabled: boolean = false;
  private _saFormControlName?: SAFormControlNameDirective | null;
  /** The host FormControlName, resolved on first use: it cannot be injected during construction,
   *  and resolving it in a microtask left the required marker unrendered under OnPush. */
  get saFormControlName(): SAFormControlNameDirective | null {
    if (this._saFormControlName === undefined) {
      this._saFormControlName = this.injector.get(SAFormControlNameDirective, null);
    }
    return this._saFormControlName;
  }
  constructor(
    private injector: Injector,
    private formManagementService: FormManagementService,
    private destroyRef: DestroyRef,
  ) {
  }

  ngOnInit(): void {
    this.rangeForm = this.formManagementService.getRangeFormFieldForm();

    this.rangeForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(x => {
      const { minValue, maxValue } = x;
      if (minValue != null && maxValue != null && minValue > maxValue) {
        this.rangeForm.patchValue({ maxValue: minValue }, { emitEvent: false });
      }
      this.onChange(this.rangeForm.getRawValue());
    });
  }

  onChange: (value: unknown) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: unknown): void {
    if (value && typeof value === 'object' && this.rangeForm) {
      this.rangeForm.patchValue(value as Record<string, unknown>, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
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
