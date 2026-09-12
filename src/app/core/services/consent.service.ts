import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ConsentChoice = 'granted' | 'denied';

/** The stored answer, so the banner is asked once per browser. */
const STORAGE_KEY = 'bhm_consent';
const STORAGE_VERSION = 1;

/**
 * Where analytics storage needs an opt-in: the EEA, the UK and Switzerland.
 * One list, used twice — as the regional `denied` default for Google's own
 * geolocation, and to decide whether this visitor sees the banner at all.
 */
const OPT_IN_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', 'GB', 'CH',
];

/** Cloudflare answers this on our own origin with the visitor's country. */
const TRACE_URL = '/cdn-cgi/trace';
const TRACE_TIMEOUT_MS = 3000;

interface StoredConsent {
  v: number;
  analytics: ConsentChoice;
  at: string;
}

/**
 * Consent Mode v2, and the banner that collects it.
 *
 * Google's tags read consent from the same `dataLayer` the tag manager reads,
 * through `gtag('consent', …)`. The defaults are set **before** the container
 * loads, so no tag can write a cookie before the answer is known: granted
 * everywhere, then denied by `region` in the countries that require an opt-in,
 * with advertising storage denied throughout because the site runs no ads.
 *
 * The banner is shown only where consent is required, which is decided by
 * Cloudflare's `/cdn-cgi/trace` rather than by a geolocation service: it is on
 * our own origin, costs one small request, and never leaves the edge. If it
 * cannot be read, the banner is shown — the safe way round.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private platformId = inject(PLATFORM_ID);

  /** Whether the banner is on screen. */
  readonly showBanner = signal(false);
  /** The stored answer, or null while it has never been given. */
  readonly choice = signal<ConsentChoice | null>(null);

  /**
   * Creates the `gtag` queue, publishes the defaults and restores a stored
   * answer. Called by `GoogleTagManagerService` before the container loads.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.dataLayer = window.dataLayer ?? [];
    // gtag.js only recognises `arguments` objects on the dataLayer, so this
    // must stay a `function` rather than an arrow.
    window.gtag = window.gtag ?? function () {
      // eslint-disable-next-line prefer-rest-params
      (window.dataLayer as unknown[]).push(arguments);
    };

    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted',
    });
    // Google resolves the region itself, from the request, before any tag runs.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      region: OPT_IN_COUNTRIES,
      wait_for_update: 500,
    });
    window.gtag('set', 'ads_data_redaction', true);

    const stored = this.read();
    if (stored) {
      this.choice.set(stored.analytics);
      this.update(stored.analytics);
      return;
    }

    void this.decideBanner();
  }

  /** The visitor accepted analytics cookies. */
  accept(): void {
    this.store('granted');
  }

  /** The visitor refused. Nothing is written, and nothing is asked again. */
  reject(): void {
    this.store('denied');
  }

  /** The privacy page's "change your choice" control. */
  reopen(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.showBanner.set(true);
  }

  private store(analytics: ConsentChoice): void {
    this.choice.set(analytics);
    this.showBanner.set(false);
    this.update(analytics);

    try {
      const value: StoredConsent = { v: STORAGE_VERSION, analytics, at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // A browser that refuses storage asks again next visit. That is the
      // worst it costs, and it is not worth a second mechanism.
    }
  }

  private update(analytics: ConsentChoice): void {
    window.gtag?.('consent', 'update', { analytics_storage: analytics });
    // Something to trigger on inside the container, and the record of when the
    // answer changed.
    window.dataLayer?.push({ event: 'consent_update', consent_analytics: analytics });
  }

  private read(): StoredConsent | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredConsent;
      return parsed?.v === STORAGE_VERSION && (parsed.analytics === 'granted' || parsed.analytics === 'denied')
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  /** Asks the edge where the visitor is, and shows the banner if it matters. */
  private async decideBanner(): Promise<void> {
    let country: string | null = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TRACE_TIMEOUT_MS);
      const response = await fetch(TRACE_URL, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (response.ok) {
        country = /(?:^|\n)loc=([A-Z]{2})/.exec(await response.text())?.[1] ?? null;
      }
    } catch {
      country = null;
    }

    // An unknown country is treated as one that needs asking.
    this.showBanner.set(country === null || OPT_IN_COUNTRIES.includes(country));
  }
}
