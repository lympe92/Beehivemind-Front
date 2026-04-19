import { Component, input, output, ContentChild, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './modal-shell.html',
  styleUrl: './modal-shell.scss',
})
export class ModalShellComponent {
  readonly title = input('');
  readonly subtitle = input('');
  readonly close = output<void>();

  @ContentChild('footer', { read: TemplateRef }) footerTpl?: TemplateRef<void>;
}
