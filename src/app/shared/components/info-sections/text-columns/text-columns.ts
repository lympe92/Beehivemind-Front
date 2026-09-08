import { Component, input } from '@angular/core';
import { TextColumn } from './text-columns.model';

/**
 * Three columns of text, no artwork, no action. The heading level is the
 * caller's to declare — a component mid-page cannot know its own depth:
 * `level="2"` directly under a page h1, the default h3 after an h2.
 * Usage: `<section app-text-columns [columns]="…" [level]="2"></section>`.
 */
@Component({
  selector: 'section[app-text-columns]',
  standalone: true,
  imports: [],
  templateUrl: './text-columns.html',
  host: { class: 'text-columns' },
})
export class TextColumnsComponent {
  columns = input.required<TextColumn[]>();
  level = input<2 | 3>(3);
}
