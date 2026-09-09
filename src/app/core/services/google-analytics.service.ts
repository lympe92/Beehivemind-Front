import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { runWhenIdle } from '../utils/run-when-idle';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { AnalyticsService } from './analytics.service';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Loads gtag.js and reports page views. Everything else that reaches GA4 goes
 * through `AnalyticsService`, which this wires up once the stub exists.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAnalyticsService {
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);
  private store      = inject(Store);
  private analytics  = inject(AnalyticsService);

  init(): void {
    if (!isPlatformBrowser(this.platformId) || !environment.googleAnalyticsId) return;

    // The audit harness, and any other driven browser, announce themselves
    // here. Keeping them out is what makes "users" mean people.
    if (navigator.webdriver) return;

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
      .subscribe(() => {
        // A microtask later, so the title a page sets on this same
        // NavigationEnd is the one reported, not the previous page's.
        queueMicrotask(() => {
          window.gtag!('event', 'page_view', {
            page_location: location.href,
            page_title: document.title,
          });
        });
      });

    // The restored session, every login and every logout, in one place.
    this.store
      .select(selectCurrentUser)
      .pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
      .subscribe((user) => this.analytics.setUser(user));

    this.analytics.trackClicks();

    runWhenIdle(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
    });
  }
}
