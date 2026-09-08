import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { runWhenIdle } from '../utils/run-when-idle';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);

  init(): void {
    if (!isPlatformBrowser(this.platformId) || !environment.googleAnalyticsId) return;

    const measurementId = environment.googleAnalyticsId;

    // The stub queues commands on the dataLayer until gtag.js arrives, so the
    // script itself can wait for the page to be idle without losing the first
    // page_view. gtag.js only recognises `arguments` objects on the dataLayer;
    // a plain array is silently ignored, so this must stay a `function`.
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        window.gtag!('event', 'page_view', { page_path: event.urlAfterRedirects });
      });

    runWhenIdle(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    });
  }
}
