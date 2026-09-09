import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
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
import { RichTextComponent } from '../../form-fields/richtext/richtext.component';

/** `app` uses the dashboard's compact button, `website` the marketing pill. */
export type FormVariant = 'app' | 'website';

/**
 * The form driver: a `DynamicField[]` config in, a wired form out. Layout is
 * the `.dform` twelve-column grid in styles/components/forms/forms.css; the
 * actions stay inside the <form> so Enter submits.
 */
@Component({
  selector: 'app-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    RadioComponent,
    CheckboxesComponent,
    RangeComponent,
    ToggleComponent,
    MapFieldComponent,
    RichTextComponent,
  ],
  templateUrl: './form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponent implements OnInit {
  private formManagementService = inject(FormManagementService);
  private destroyRef = inject(DestroyRef);

  readonly fields = input<DynamicField[]>([]);
  readonly submitLabel = input<string>('Save');
  readonly cancelLabel = input<string>('');
  readonly loading = input<boolean>(false);
  readonly variant = input<FormVariant>('app');

  readonly submitForm = output<Record<string, unknown>>();
  readonly cancel = output<void>();

  readonly submitClass = computed(() =>
    this.variant() === 'website' ? 'btn btn--md btn--primary' : 'app-btn app-btn--primary',
  );
  readonly ghostClass = computed(() =>
    this.variant() === 'website' ? 'btn btn--md btn--outline' : 'app-btn app-btn--ghost',
  );

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.formManagementService.getDynamicForm(this.fields());
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formManagementService.disableFieldsIfNeeded(this.form, this.fields());
    });
  }

  submit(): void {
    if (this.loading()) return;
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
