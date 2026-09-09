import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User } from '../../store/auth/auth.state';

type EventParams = Record<string, string | number | boolean | null | undefined>;

/**
 * The one place application code talks to GA4.
 *
 * `GoogleAnalyticsService` owns the script and the page views; this carries
 * everything else: the funnel (`sign_up`, `email_confirmed`, `login`), the
 * activation steps that `analyticsInterceptor` derives from API writes
 * (`create_apiary`, `create_inspection`, …), the clicks that are conversions
 * in their own right (`app_store_click`, `cta_click`, `generate_lead`), and the
 * signed-in user's id, which is what lets GA4 follow one beekeeper across
 * sessions and devices and answer "how many of the people who signed up ever
 * recorded an inspection".
 *
 * No PII passes through here. The user id is the numeric primary key; the user
 * properties are a country and how the account signs in. The email never
 * leaves the app.
 *
 * Every method is a no-op on the server and without a measurement id, so
 * callers never guard.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private platformId = inject(PLATFORM_ID);

  private readonly enabled = isPlatformBrowser(this.platformId) && !!environment.googleAnalyticsId;

  event(name: string, params: EventParams = {}): void {
    if (!this.enabled || typeof window.gtag !== 'function') return;
    window.gtag('event', name, params);
  }

  /**
   * Attaches (or, with `null`, detaches) the signed-in user to every event that
   * follows. Called on login, on logout, and on the restored session at start.
   */
  setUser(user: User | null): void {
    if (!this.enabled || typeof window.gtag !== 'function') return;
    window.gtag('set', { user_id: user ? String(user.id) : null });
    window.gtag('set', 'user_properties', {
      country: user ? (user.country ?? '(not set)') : null,
      auth_method: user ? (user.has_password ? 'email' : 'google') : null,
    });
  }

  /**
   * One document-level listener rather than a directive on every button: the
   * store badges and the register CTAs are plain anchors in section configs
   * that do not know analytics exists.
   */
  trackClicks(): void {
    if (!this.enabled) return;

    document.addEventListener(
      'click',
      (e) => {
        const anchor = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;

        const href = anchor.getAttribute('href') ?? '';
        const page_path = location.pathname;

        if (href.includes('play.google.com')) {
          this.event('app_store_click', { store: 'google_play', page_path });
        } else if (href.includes('apps.apple.com')) {
          this.event('app_store_click', { store: 'app_store', page_path });
        } else if (href === '/auth/register') {
          this.event('cta_click', { cta_text: anchor.textContent?.trim().slice(0, 60) ?? '', page_path });
        }
      },
      { capture: true, passive: true },
    );
  }
}
