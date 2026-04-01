import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { CtaLink } from '../../ui/link-button/link-button.model';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [LinkButtonComponent],
  templateUrl: './cta-banner.html',
  styleUrl: './cta-banner.scss',
})
export class CtaBannerComponent {
  title = input.required<string>();
  description = input.required<string>();
  cta = input.required<CtaLink>();
}
