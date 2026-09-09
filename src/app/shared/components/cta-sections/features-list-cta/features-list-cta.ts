import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageComponent } from '../../ui/image/image';
import { FeatureItem } from './features-list-cta.model';

/**
 * A grid of illustrated features closed by one action. The CTA is a bare
 * href/label pair rather than a CtaLink because it was written for a
 * destination off the site; an absolute http(s) href still opens in a new tab,
 * anything else is a route. Steps 1 → 2 → 3.
 * Usage: `<section app-features-list-cta …></section>`.
 */
@Component({
  selector: 'section[app-features-list-cta]',
  standalone: true,
  imports: [ImageComponent, RouterLink],
  templateUrl: './features-list-cta.html',
  host: { class: 'container features-list-cta' },
})
export class FeaturesListCtaComponent {
  title = input.required<string>();
  items = input.required<FeatureItem[]>();
  ctaHref = input.required<string>();
  ctaLabel = input.required<string>();

  readonly external = computed(() => /^https?:\/\//.test(this.ctaHref()));
}
