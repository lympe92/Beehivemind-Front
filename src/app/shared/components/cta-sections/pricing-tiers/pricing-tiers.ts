import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { PricingTier } from './pricing-tiers.model';

/**
 * The plans band: three tiers, each stating who it is for and then what it
 * lifts — not a feature matrix. The featured tier gets a 2px ink edge and a
 * filled button; the others are outlined. `note` is optional and the title
 * owns the gap beneath it when there is none.
 * Usage: `<section app-pricing-tiers title="Plans" [tiers]="…"></section>`.
 */
@Component({
  selector: 'section[app-pricing-tiers]',
  standalone: true,
  imports: [LinkButtonComponent],
  templateUrl: './pricing-tiers.html',
  host: { class: 'pricing' },
})
export class PricingTiersComponent {
  title = input.required<string>();
  note = input<string>('');
  tiers = input.required<PricingTier[]>();
}
