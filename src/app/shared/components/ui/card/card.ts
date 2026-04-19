import { Component, ContentChild, input, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './card.html',
  styleUrl: './card.scss',
  host: { class: 'card-host' },
})
export class CardComponent {
  readonly title = input('');
  readonly flush = input(false);
  readonly height = input('');

  @ContentChild('cardFooter', { read: TemplateRef }) footerTpl?: TemplateRef<void>;
}
