import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/**
 * The chrome inside every dialog: header, scrolling body, optional footer.
 * Styles: `.mshell*` in styles/components/app/app.css. Footer buttons are
 * `.app-btn` — `--ghost` to dismiss, `--primary` to confirm, `--danger-solid`
 * when confirming destroys something.
 */
@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './modal-shell.html',
})
export class ModalShellComponent {
  readonly title = input('');
  readonly subtitle = input('');
  readonly close = output<void>();

  @ContentChild('footer', { read: TemplateRef }) footerTpl?: TemplateRef<void>;
}
