import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../../../../core/services/consent.service';

/**
 * The cookie question, asked once, where the law requires it to be asked.
 *
 * Accept and Reject carry the same weight, which is what the UK and EU
 * regulators ask for and what keeps the answer meaningful. The panel is fixed
 * to the bottom of the viewport, so it costs no layout shift, and it is only
 * ever rendered in the browser: `ConsentService` decides whether to show it
 * after the edge has said which country the visitor is in.
 */
@Component({
  selector: 'app-consent-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './consent-banner.html',
})
export class ConsentBannerComponent {
  protected readonly consent = inject(ConsentService);
}
