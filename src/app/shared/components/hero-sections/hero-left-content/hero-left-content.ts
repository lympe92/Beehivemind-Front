import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';

@Component({
  selector: 'app-hero-left-content',
  standalone: true,
  imports: [LinkButtonComponent, ImageComponent],
  templateUrl: './hero-left-content.html',
  styleUrl: './hero-left-content.scss',
})
export class HeroLeftContentComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
  primaryCta = input.required<CtaLink>();
  secondaryCta = input.required<CtaLink>();
}
