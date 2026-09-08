import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { DynamicField } from '../../../../../core/models/form.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { FormComponent } from '../../form/form.component';

export interface FormModalData {
  title: string;
  subtitle?: string;
  fields: DynamicField[];
  submitLabel?: string;
  /** Renders a ghost cancel button beside submit; closes with no result. */
  cancelLabel?: string;
}

/**
 * A dialog whose body is one `<app-form>` config. Submit closes with the form
 * value; close or cancel closes with nothing.
 */
@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [ModalShellComponent, FormComponent],
  template: `
    <app-modal-shell [title]="data.title" [subtitle]="data.subtitle ?? ''" (close)="dialogRef.close()">
      <app-form
        [fields]="data.fields"
        [submitLabel]="data.submitLabel ?? 'Save'"
        [cancelLabel]="data.cancelLabel ?? ''"
        (cancel)="dialogRef.close()"
        (submitForm)="dialogRef.close($event)"
      />
    </app-modal-shell>
  `,
})
export class FormModalComponent {
  protected dialogRef = inject(DialogRef);
  readonly data = inject<FormModalData>(MODAL_DATA);
}
