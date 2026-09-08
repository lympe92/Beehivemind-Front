import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface SuspendUserModalData {
  /** The person being suspended, for the title. */
  name: string;
}

/** `until` is null for an indefinite suspension, else a `YYYY-MM-DD` date. */
export interface SuspendUserResult {
  until: string | null;
}

/**
 * Asks for how long an account is suspended. Opened from the admin users
 * page; the answer is written straight to `admin/users/:id/status`.
 */
@Component({
  selector: 'app-suspend-user-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './suspend-user-modal.html',
})
export class SuspendUserModalComponent {
  private dialogRef = inject(DialogRef<SuspendUserResult>);
  readonly data = inject<SuspendUserModalData>(MODAL_DATA);

  mode = signal<'indefinite' | 'until'>('indefinite');
  until = '';

  get canConfirm(): boolean {
    return this.mode() === 'indefinite' || !!this.until;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.canConfirm) return;
    this.dialogRef.close({ until: this.mode() === 'until' ? this.until : null });
  }
}
