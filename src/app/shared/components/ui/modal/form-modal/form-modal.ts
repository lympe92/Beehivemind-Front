import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { DynamicField } from '../../../../../core/models/form.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { FormComponent } from '../../form/form.component';

export interface FormModalData {
  title: string;
  fields: DynamicField[];
  submitLabel?: string;
}

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [ModalShellComponent, FormComponent],
  template: `
    <app-modal-shell [title]="data.title" (close)="dialogRef.close()">
      <app-form
        [fields]="data.fields"
        [submitLabel]="data.submitLabel ?? 'Save'"
        (submitForm)="dialogRef.close($event)"
      />
    </app-modal-shell>
  `,
})
export class FormModalComponent {
  protected dialogRef = inject(DialogRef);
  readonly data = inject<FormModalData>(MODAL_DATA);
}