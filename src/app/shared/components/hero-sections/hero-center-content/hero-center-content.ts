import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';

/**
 * The centred page opener: headline, a lead-size subtitle, the two calls to
 * action, then artwork below. Same content model as HeroLeftContent.
 * Usage: `<section app-hero-center-content …></section>`.
 */
@Component({
  selector: 'section[app-hero-center-content]',
  standalone: true,
  imports: [ImageComponent, LinkButtonComponent],
  templateUrl: './hero-center-content.html',
  host: { class: 'container hero' },
})
export class HeroCenterContentComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
  primaryCta = input.required<CtaLink>();
  secondaryCta = input.required<CtaLink>();
}
