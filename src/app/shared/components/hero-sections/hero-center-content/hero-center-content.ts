import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';

@Component({
  selector: 'app-hero-center-content',
  standalone: true,
  imports: [ImageComponent, LinkButtonComponent],
  templateUrl: './hero-center-content.html',
  styleUrl: './hero-center-content.scss',
})
export class HeroCenterContentComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
  primaryCta = input.required<CtaLink>();
  secondaryCta = input.required<CtaLink>();
}
