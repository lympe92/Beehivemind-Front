import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';

/**
 * The site's default page opener: copy left, artwork right, a loud CTA next to
 * a quiet one. Below lg the columns stack and the artwork moves above the copy.
 *
 * The host is the <section>, so the band rule in base.css (`main > section`)
 * reaches it: `<section app-hero-left-content …></section>`.
 * The subtitle is a paragraph, not an h4 — it is copy, and an h4 after the h1
 * skipped two outline levels. `proof` is three short facts, no icons, no cards.
 */
@Component({
  selector: 'section[app-hero-left-content]',
  standalone: true,
  imports: [LinkButtonComponent, ImageComponent],
  templateUrl: './hero-left-content.html',
  host: { class: 'container hero' },
})
export class HeroLeftContentComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
  primaryCta = input.required<CtaLink>();
  secondaryCta = input.required<CtaLink>();
  proof = input<string[]>([]);
}
