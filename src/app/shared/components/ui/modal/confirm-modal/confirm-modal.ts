import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA, ConfirmConfig } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

/**
 * The yes/no dialog. Reach for it only when the action is destructive or
 * irreversible, and write the message as the consequence, not the question.
 */
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './confirm-modal.html',
})
export class ConfirmModalComponent {
  private dialogRef = inject(DialogRef<boolean>);
  readonly data = inject<ConfirmConfig>(MODAL_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
