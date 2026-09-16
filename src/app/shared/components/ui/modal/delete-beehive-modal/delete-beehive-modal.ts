import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface DeleteBeehiveModalData {
  /** The hive being deleted, as the table names it. */
  name: string;
  /** True when the hive still holds a queen — the only case that needs an answer. */
  hasQueen: boolean;
  /** Where a queen could move to: every other hive, named as the table names them. */
  targets: { id: number; name: string }[];
}

/** What the API needs to know before it deletes: what happens to the queen. */
export interface DeleteBeehiveResult {
  queenFate: 'lost' | 'moved';
  targetBeehiveId?: number;
}

/**
 * Deleting a hive that holds a queen is two decisions, not one: the hive goes,
 * and the queen is either gone with it or moved to another hive. The API has
 * always required the answer; the plain confirm never asked, so every delete
 * came back "Validation failed".
 */
@Component({
  selector: 'app-delete-beehive-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './delete-beehive-modal.html',
})
export class DeleteBeehiveModalComponent {
  private dialogRef = inject<DialogRef<DeleteBeehiveResult>>(DialogRef);
  readonly data = inject<DeleteBeehiveModalData>(MODAL_DATA);

  readonly fate = signal<'lost' | 'moved'>('lost');
  /** A signal, not a field: the confirm button reads it through a computed. */
  readonly target = signal<number | null>(null);

  readonly canConfirm = computed(() => !this.data.hasQueen || this.fate() === 'lost' || this.target() !== null);

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    if (!this.canConfirm()) return;

    this.dialogRef.close(
      this.data.hasQueen && this.fate() === 'moved'
        ? { queenFate: 'moved', targetBeehiveId: Number(this.target()) }
        : { queenFate: 'lost' },
    );
  }
}
