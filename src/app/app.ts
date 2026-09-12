import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/ui/toast/toast.component';
import { ConsentBannerComponent } from './shared/components/ui/consent-banner/consent-banner';
import { GoogleTagManagerService } from './core/services/google-tag-manager.service';
import { ConsentService } from './core/services/consent.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, ConsentBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('beehivemind-Front');
  // The whole measurement stack: consent, page views, events, the container.
  private tagManager = inject(GoogleTagManagerService);
  private consent = inject(ConsentService);

  /**
   * Drives the `@defer` block around the banner, so the markup and its
   * component are fetched only by the visitors who are actually asked — which
   * is nobody outside the EEA, the UK and Switzerland.
   */
  protected readonly showConsent = this.consent.showBanner;

  constructor() {
    this.tagManager.init();
  }
}
