import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
})
export class FormComponent implements OnInit {
  @Input() fields: DynamicField[] = [];
  @Input() submitLabel: string = 'Submit';
  @Input() loading: boolean = false;

  @Output() submitForm = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private formManagementService: FormManagementService) {}

  ngOnInit(): void {
    this.form = this.formManagementService.getDynamicForm(this.fields);
    this.form.valueChanges.subscribe(() => {
      this.formManagementService.disableFieldsIfNeeded(this.form, this.fields);
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
