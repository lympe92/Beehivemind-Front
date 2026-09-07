import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  init(): void {
    if (!isPlatformBrowser(this.platformId) || !environment.googleAnalyticsId) return;

    const measurementId = environment.googleAnalyticsId;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer!.push(args);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: false });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        window.gtag!('event', 'page_view', { page_path: event.urlAfterRedirects });
      });
  }
}
