import { Component, input } from '@angular/core';

export type RibbonMode = 'default' | 'dark';

/**
 * A full-bleed pull quote. A blockquote, not headings — a testimonial is not
 * part of the document outline. The quotation marks come from CSS, so the
 * string stays a plain sentence. Always `mode="dark"` on a white page.
 * Usage: `<section app-ribbon mode="dark" [quote]="…" [author]="…"></section>`.
 * Never place one directly against a CtaBanner — the boundary disappears.
 */
@Component({
  selector: 'section[app-ribbon]',
  standalone: true,
  imports: [],
  templateUrl: './ribbon.html',
  host: {
    class: 'ribbon',
    '[class.ribbon--dark]': "mode() === 'dark'",
  },
})
export class RibbonComponent {
  mode = input<RibbonMode>('default');
  quote = input.required<string>();
  author = input<string>();
}
