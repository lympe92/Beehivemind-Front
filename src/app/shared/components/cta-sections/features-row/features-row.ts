import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { CtaLink } from '../../ui/link-button/link-button.model';
import { FeatureRowItem } from './features-row.model';

/**
 * Four columns of centred title over justified copy, closed by one centred
 * CTA. Steps 1 → 2 → 4 by breakpoint; four items is the designed count. An
 * item may end in a plain text link to the page that covers it.
 * Usage: `<section app-features-row [items]="…" [cta]="…"></section>`.
 */
@Component({
  selector: 'section[app-features-row]',
  standalone: true,
  imports: [LinkButtonComponent, RouterLink],
  templateUrl: './features-row.html',
  host: { class: 'container' },
})
export class FeaturesRowComponent {
  items = input.required<FeatureRowItem[]>();
  cta = input.required<CtaLink>();
}
