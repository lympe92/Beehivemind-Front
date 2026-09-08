import { Component, input } from '@angular/core';

/**
 * A lighter page opener than a hero: an optional eyebrow, a headline, one line
 * of lead, a hairline underneath. No artwork, no calls to action — for pages
 * that are documents rather than pitches (privacy, terms, help, blog).
 * Usage: `<section app-page-intro eyebrow="Legal" title="…" lead="…"></section>`.
 */
@Component({
  selector: 'section[app-page-intro]',
  standalone: true,
  templateUrl: './page-intro.html',
  host: { class: 'container page-intro hero' },
})
export class PageIntroComponent {
  eyebrow = input<string>('');
  title = input.required<string>();
  lead = input<string>('');
}
