import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { runWhenIdle } from '../utils/run-when-idle';
import { selectIsEmployeeLoggedIn } from '../../store/employee-auth/employee-auth.selectors';
import { AnalyticsService } from './analytics.service';
import { ConsentService } from './consent.service';

type ClarityQueue = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    clarity?: ClarityQueue;
  }
}

/** The two auth screens that are recorded; every other `/auth/*` carries a token in its URL. */
const RECORDED_AUTH = /^\/auth\/(login|register)\/?$/;
/** The admin console and the rest of auth: never recorded. */
const NEVER_RECORDED = /^\/(admin|auth)(\/|$)/;
const REGISTER_PATH = /^\/auth\/register\/?$/;

/** The GA4 events Clarity also hears about, and the one parameter each keeps as a tag. */
const FORWARDED: Record<string, { tag: string; param: string } | null> = {
  cta_click: null,
  app_store_click: { tag: 'store', param: 'store' },
  sign_up: { tag: 'sign_up_method', param: 'method' },
};

/** Whether a path may be recorded: the public site, login and register, and the beekeeper's app. */
export function isRecordablePath(path: string): boolean {
  return RECORDED_AUTH.test(path) || !NEVER_RECORDED.test(path);
}

/**
 * Microsoft Clarity: session recordings and heatmaps of the public site and
 * of the beekeeper's app (`/user`, owner's decision of 2026-11-14).
 *
 * Unlike GA4 it is not a tag inside the container, because three rules have to
 * hold in code rather than in a console somebody can edit:
 *
 * - **Consent first.** The script is not fetched until analytics is allowed
 *   (`ConsentService.analyticsAllowed`): after Accept where the banner is
 *   shown, by default where it is not. A withdrawn answer is sent to Clarity,
 *   which deletes its cookies, and recording stops.
 * - **The app is recorded masked.** `user-layout` and every dialog
 *   (`ModalShellComponent`) carry `data-clarity-mask`, so Clarity receives where
 *   a beekeeper clicks and scrolls but none of the text on screen: no apiary,
 *   hive or record leaves the browser. No `identify` call is made either.
 * - **Never the admin console, never a token.** `/admin` and every auth screen
 *   except login and register are not recorded. The script is never fetched on
 *   a visit that starts there, and a visit that walks in is stopped at that
 *   navigation and resumed only back on a recorded page.
 * - **Not us.** Driven browsers, `?bhm_internal=on` and signed-in employees are
 *   left out, the same as in GA4.
 *
 * `stop` and `start` are clarity-js methods reached through the tag's queue
 * function; Microsoft's reference does not list them, so `admin-layout` also
 * carries `data-clarity-mask` in case they ever change.
 */
@Injectable({ providedIn: 'root' })
export class ClarityService {
  private platformId = inject(PLATFORM_ID);
  private router     = inject(Router);
  private store      = inject(Store);
  private consent    = inject(ConsentService);
  private analytics  = inject(AnalyticsService);

  private readonly projectId = environment.clarityProjectId;

  private started  = false;
  private internal = false;
  /** The script tag has been queued; it is fetched once per page load. */
  private loaded   = false;
  /** Clarity is recording this page. */
  private running  = false;
  /** Navigations so far, and the last one whose register form was reported. */
  private navigation = 0;
  private registerReported = -1;

  constructor() {
    // Reads the consent signal, so it runs again on Accept, on Reject and on
    // the privacy page's "change your choice".
    effect(() => {
      const allowed = this.consent.analyticsAllowed();
      if (!allowed) this.withdraw();
      this.sync();
    });
  }

  /** Called once by `GoogleTagManagerService`, after the consent defaults. */
  init(internal: boolean): void {
    if (!isPlatformBrowser(this.platformId) || !this.projectId || this.started) return;
    this.started = true;
    this.internal = internal;

    this.analytics.listen((name, params) => this.forward(name, params));

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigation++;
        this.sync();
      });

    this.store.select(selectIsEmployeeLoggedIn).subscribe((isEmployee) => {
      if (!isEmployee) return;
      this.internal = true;
      this.sync();
    });

    this.sync();
  }

  /**
   * A GA4 event on its way to the dataLayer. Only the few that mark the
   * sign-up funnel are repeated to Clarity, so a recording can be found by them.
   */
  forward(name: string, params: Record<string, unknown>): void {
    if (!this.running || !(name in FORWARDED)) return;
    const tag = FORWARDED[name];
    const value = tag ? params[tag.param] : undefined;
    if (tag && typeof value === 'string') window.clarity?.('set', tag.tag, value);
    window.clarity?.('event', name);
  }

  /** Brings Clarity in line with consent, the zone and whose browser this is. */
  private sync(): void {
    if (!this.started) return;

    const wanted = this.consent.analyticsAllowed() && !this.internal && isRecordablePath(location.pathname);

    if (wanted && !this.loaded) {
      this.load();
    } else if (wanted && !this.running) {
      window.clarity?.('start');
      this.grant();
      this.running = true;
    } else if (!wanted && this.running) {
      window.clarity?.('stop');
      this.running = false;
    }

    if (this.running && REGISTER_PATH.test(location.pathname) && this.registerReported !== this.navigation) {
      this.registerReported = this.navigation;
      window.clarity?.('event', 'register_form_open');
    }
  }

  private load(): void {
    this.loaded = true;
    this.running = true;

    // Clarity's own bootstrap: calls made before the script arrives wait here.
    const queue: ClarityQueue = window.clarity ?? function (...args: unknown[]) {
      (queue.q = queue.q ?? []).push(args);
    };
    window.clarity = queue;
    this.grant();

    runWhenIdle(() => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${this.projectId}`;
      document.head.appendChild(script);
    });
  }

  /** Analytics only: the site runs no Microsoft advertising. */
  private grant(): void {
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
  }

  /** The visitor changed their mind: tell Clarity, which erases its cookies. */
  private withdraw(): void {
    if (!this.loaded) return;
    window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
    window.clarity?.('consent', false);
  }
}
