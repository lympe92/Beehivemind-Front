import { Component, DestroyRef, forwardRef, inject, Injector, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { merge, Observable, of, switchMap } from 'rxjs';
import { SAFormControlNameDirective } from '../../../../core/directives/dynamic-field.directive';
import { ErrorsComponent } from '../errors/errors.component';
import { FieldOption } from '../../../../core/models/form-fields.model';

@Component({
  selector: 'app-form-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
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
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  imports: [ErrorsComponent, ReactiveFormsModule],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() isMultiple = false;
  @Input() options?: Observable<FieldOption[]> | ((value: any) => Observable<FieldOption[]>);
  @Input() cascadeFrom?: string;

  resolvedOptions: FieldOption[] = [];
  value: string = '';
  disabled: boolean = false;
  saFormControlName?: SAFormControlNameDirective | null;
  form!: FormGroup;

  private destroyRef = inject(DestroyRef);

  constructor(
    private injector: Injector,
    private formBuilder: FormBuilder,
  ) {
    queueMicrotask(() => {
      this.saFormControlName = this.injector.get(SAFormControlNameDirective, null);
      this.setupOptions();
    });

    this.form = this.formBuilder.group({
      select: [this.isMultiple ? [] : null],
    });

    this.form.valueChanges.subscribe(x => {
      this.onChange(x.select);
      this.onTouched();
    });
  }

  private setupOptions(): void {
    if (typeof this.options === 'function') {
      const parentForm = (this.saFormControlName?.formDirective as FormGroupDirective)?.form;
      const sourceControl = parentForm?.get(this.cascadeFrom!);
      if (!sourceControl) return;

      merge(of(sourceControl.value), sourceControl.valueChanges)
        .pipe(
          switchMap(val => (this.options as (v: any) => Observable<FieldOption[]>)(val)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(opts => (this.resolvedOptions = opts));
    } else if (this.options) {
      this.options
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(opts => (this.resolvedOptions = opts));
    }
  }

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    if (value !== undefined) {
      this.value = value;
      this.form.get('select')?.patchValue(value);
    }
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
