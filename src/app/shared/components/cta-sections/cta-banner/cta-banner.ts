import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { CtaLink } from '../../ui/link-button/link-button.model';

/**
 * The page's closing band: ink, centred, one action — and, where the page has
 * a blog category behind it, a second, quieter link to it. One per page (the
 * inspections page's title-only mid-page pivot is the single exception).
 * Pass `variant: 'outline'` on the CTA — its label flips to white here.
 * Usage: `<section app-cta-banner …></section>`.
 */
@Component({
  selector: 'section[app-cta-banner]',
  standalone: true,
  imports: [LinkButtonComponent],
  templateUrl: './cta-banner.html',
  host: { class: 'cta-banner' },
})
export class CtaBannerComponent {
  title = input.required<string>();
  description = input<string>('');
  cta = input.required<CtaLink>();
  /** Optional second action, drawn the same way; the product pages point it at their blog category. */
  secondary = input<CtaLink | undefined>(undefined);
}
