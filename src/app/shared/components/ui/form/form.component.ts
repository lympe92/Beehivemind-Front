import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormManagementService } from '../../../../core/services/forms-management.service';
import { DynamicField } from '../../../../core/models/form.model';
import { InputComponent } from '../../form-fields/input/input.component';
import { TextareaComponent } from '../../form-fields/textarea/textarea.component';
import { SelectComponent } from '../../form-fields/select/select.component';
import { RadioComponent } from '../../form-fields/radio/radio.component';
import { CheckboxesComponent } from '../../form-fields/checkboxes/checkboxes.component';
import { RangeComponent } from '../../form-fields/range/range.component';
import { ToggleComponent } from '../../form-fields/toggle/toggle.component';
import { MapFieldComponent } from '../../form-fields/map-field/map-field.component';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    NgClass,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    RadioComponent,
    CheckboxesComponent,
    RangeComponent,
    ToggleComponent,
    MapFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent implements OnInit {
  private formManagementService = inject(FormManagementService);
  private destroyRef = inject(DestroyRef);

  readonly fields = input<DynamicField[]>([]);
  readonly submitLabel = input<string>('Submit');
  readonly loading = input<boolean>(false);

  readonly submitForm = output<Record<string, unknown>>();

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.formManagementService.getDynamicForm(this.fields());
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formManagementService.disableFieldsIfNeeded(this.form, this.fields());
    });
  }

  submit(): void {
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
