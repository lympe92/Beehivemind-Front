import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { ConsentService } from '../../../core/services/consent.service';

/**
 * ⚠ The structure and the plain-language explanations are grounded in what the
 * app demonstrably collects. The wording is NOT legal advice and has not been
 * reviewed. Three paragraphs marked in muted grey need real values — the
 * lawful basis, the processor list, the retention periods — before this ships.
 *
 * The cookies section is the one place a visitor can change the analytics
 * answer they gave the banner, which is why this page injects the service.
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [PageIntroComponent, RouterLink],
  templateUrl: './privacy.html',
})
export class PrivacyComponent {
  protected readonly consent = inject(ConsentService);
}
