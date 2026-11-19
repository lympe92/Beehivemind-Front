import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { PageHelp, pageHelp, PageHelpId } from '../../../../../core/help/page-help';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface PageHelpModalData {
  /** The entry the active route named (`data: { help }`). */
  id: PageHelpId;
}

/** What the panel closes with: `tutorial` when its footer button was pressed. */
export type PageHelpModalResult = 'tutorial';

/**
 * "How this page works" (Page Help design, frames 1b to 3b): a drawer about
 * the page in front of the user. It draws one `PageHelp` entry and holds no
 * words of its own beyond its headings: the copy is `core/help/page-help.ts`.
 * Opened by `user-layout`, which loads this component (and with it the copy)
 * only when the button is pressed.
 */
@Component({
  selector: 'app-page-help-modal',
  standalone: true,
  imports: [ModalShellComponent],
  templateUrl: './page-help-modal.html',
  styleUrl: './page-help-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHelpModalComponent {
  private dialogRef = inject(DialogRef<PageHelpModalResult>);
  private data = inject<PageHelpModalData>(MODAL_DATA);

  readonly help: PageHelp | null = pageHelp(this.data.id);

  close(): void {
    this.dialogRef.close();
  }

  startTutorial(): void {
    this.dialogRef.close('tutorial');
  }
}
