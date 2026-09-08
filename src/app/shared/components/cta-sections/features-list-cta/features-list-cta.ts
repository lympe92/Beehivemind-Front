import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { FeatureItem } from './features-list-cta.model';

/**
 * A grid of illustrated features closed by one external action. The CTA is a
 * bare href/label pair rather than a CtaLink because it always leaves the site
 * — the one deliberate break from the convention. Steps 1 → 2 → 3.
 * Usage: `<section app-features-list-cta …></section>`.
 */
@Component({
  selector: 'section[app-features-list-cta]',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './features-list-cta.html',
  host: { class: 'container features-list-cta' },
})
export class FeaturesListCtaComponent {
  title = input.required<string>();
  items = input.required<FeatureItem[]>();
  ctaHref = input.required<string>();
  ctaLabel = input.required<string>();
}
