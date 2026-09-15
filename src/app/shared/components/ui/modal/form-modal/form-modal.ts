import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { DynamicField } from '../../../../../core/models/form.model';
import { RecordAttribution } from '../../../../../core/models/team.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { FormComponent } from '../../form/form.component';
import { RecordMetaComponent } from '../../record-meta/record-meta';

export interface FormModalData {
  title: string;
  subtitle?: string;
  fields: DynamicField[];
  submitLabel?: string;
  /** Renders a ghost cancel button beside submit; closes with no result. */
  cancelLabel?: string;
  /** An edit dialog's "Added by …" line, above the form. Renders nothing when null. */
  meta?: RecordAttribution | null;
}

/**
 * A dialog whose body is one `<app-form>` config. Submit closes with the form
 * value; close or cancel closes with nothing.
 */
@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [ModalShellComponent, FormComponent, RecordMetaComponent],
  template: `
    <app-modal-shell [title]="data.title" [subtitle]="data.subtitle ?? ''" (close)="dialogRef.close()">
      <app-record-meta [attribution]="data.meta" />
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
