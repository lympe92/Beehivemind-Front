import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { runWhenIdle } from '../utils/run-when-idle';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { selectIsEmployeeLoggedIn } from '../../store/employee-auth/employee-auth.selectors';
import { AnalyticsService } from './analytics.service';
import { ConsentService } from './consent.service';

/** `?bhm_internal=on` marks this browser as ours for good; `off` clears it. */
const INTERNAL_PARAM = 'bhm_internal';
const INTERNAL_KEY = 'bhm_internal';

/**
 * The whole measurement stack starts here: consent defaults, the page views,
 * the signed-in user, the click listener, and last of all the container itself.
 *
 * Google Tag Manager is the only script this app loads for measurement. GA4
 * lives inside the container, configured there rather than in code, so a tag
 * can be added or a parameter renamed without a deploy. What the app owns is
 * the `dataLayer` contract in `AnalyticsService`.
 */
@Injectable({ providedIn: 'root' })
export class GoogleTagManagerService {
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);
  private store      = inject(Store);
  private analytics  = inject(AnalyticsService);
  private consent    = inject(ConsentService);

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // First, and for every browser that runs the app: no tag may write a cookie
    // before the defaults are on the dataLayer. It comes before both guards
    // below on purpose — the banner is a promise to the visitor rather than a
    // measurement detail, so it is asked and answered on the dev server and in
    // the audit battery too, neither of which ever loads a container.
    this.consent.init();

    if (!environment.googleTagManagerId) return;

    // The audit harness, and any other driven browser, announce themselves
    // here. Keeping them out is what makes "users" mean people.
    if (navigator.webdriver) return;

    this.analytics.setTrafficType(this.isInternal());

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.analytics.reportNavigation());

    // The restored session, every login and every logout, in one place; an
    // employee signed into the admin panel is our own traffic.
    combineLatest([this.store.select(selectCurrentUser), this.store.select(selectIsEmployeeLoggedIn)])
      .pipe(
        map(([user, isEmployee]) => ({ user, isEmployee })),
        distinctUntilChanged((a, b) => a.user?.id === b.user?.id && a.isEmployee === b.isEmployee),
      )
      .subscribe(({ user, isEmployee }) => {
        this.analytics.setUser(user);
        this.analytics.setTrafficType(isEmployee || this.isInternal());
      });

    this.analytics.trackClicks();

    // The container is around 120 kB on the wire; loading it after the page is
    // idle keeps it out of the first-paint critical path. Events pushed before
    // it arrives wait on the dataLayer and are replayed when it does.
    runWhenIdle(() => {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' } as Record<string, unknown>);

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${environment.googleTagManagerId}`;
      document.head.appendChild(script);
    });
  }

  /** Our own visits, kept out of the reports by a GA4 internal traffic filter. */
  private isInternal(): boolean {
    try {
      const flag = new URLSearchParams(location.search).get(INTERNAL_PARAM);
      if (flag === 'on') localStorage.setItem(INTERNAL_KEY, '1');
      if (flag === 'off') localStorage.removeItem(INTERNAL_KEY);
      return localStorage.getItem(INTERNAL_KEY) === '1';
    } catch {
      return false;
    }
  }
}
