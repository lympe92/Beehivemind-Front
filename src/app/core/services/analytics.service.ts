import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User } from '../../store/auth/auth.state';

type Primitive = string | number | boolean | null | undefined;
export type EventParams = Record<string, Primitive>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** How the site names the kind of page it is on. Sent with every event. */
const PAGE_TYPES: { match: RegExp; type: string }[] = [
  { match: /^\/$/,                                                              type: 'home' },
  { match: /^\/(features|app|inspections|apiariesandbeehives|harvestandfeeding|financial)$/, type: 'product' },
  { match: /^\/pricing$/,                                                       type: 'pricing' },
  { match: /^\/blog$/,                                                          type: 'blog_index' },
  { match: /^\/blog\/category\//,                                               type: 'blog_category' },
  { match: /^\/blog\//,                                                         type: 'blog_article' },
  { match: /^\/(help|contact)$/,                                                type: 'support' },
  { match: /^\/about$/,                                                         type: 'company' },
  { match: /^\/(privacy|terms|delete-account)$/,                                type: 'legal' },
  { match: /^\/auth\//,                                                         type: 'auth' },
  { match: /^\/user(\/|$)/,                                                     type: 'app_signed_in' },
  { match: /^\/admin(\/|$)/,                                                    type: 'admin' },
];

/** Pages whose title arrives with the API answer, after the navigation ends. */
const TITLE_ARRIVES_LATE = /^\/blog\/./;
const TITLE_WAIT_MS = 2000;

/** Product pages an article can send a reader to, for the link's own event. */
const PRODUCT_PATHS = /^\/(features|app|inspections|apiariesandbeehives|harvestandfeeding|financial|pricing)$/;

/**
 * The one place application code talks to the measurement stack.
 *
 * Nothing here calls `gtag('event', …)`. Every event is a `dataLayer` push in
 * one shape, which Google Tag Manager turns into a GA4 event:
 *
 * ```
 * dataLayer.push({ ga4: null });                                  // clear the last event's parameters
 * dataLayer.push({ event: 'ga4', ga4_event: 'sign_up', ga4: { method: 'email' } });
 * ```
 *
 * The reset matters: GTM's data model merges pushes, so without it `method`
 * would still be attached to the next event. Context that *should* persist —
 * the page type, the signed-in user — is pushed on its own, outside `ga4`.
 *
 * No PII passes through here. The user id is the numeric primary key; the user
 * properties are a country and how the account signs in.
 *
 * Every method is a no-op on the server and without a container id, so callers
 * never guard.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private platformId = inject(PLATFORM_ID);

  private readonly enabled = isPlatformBrowser(this.platformId) && !!environment.googleTagManagerId;

  /** The title of the page last reported, so a late one can be waited for. */
  private lastTitle = '';
  private pageViewPending = 0;

  /** One GA4 event. `params` are the event's own; they do not outlive it. */
  event(name: string, params: EventParams = {}): void {
    if (!this.enabled) return;
    this.push({ ga4: null });
    this.push({ event: 'ga4', ga4_event: name, ga4: params });
  }

  /** Values that ride along with every event from here on. */
  setContext(context: Record<string, Primitive>): void {
    if (!this.enabled) return;
    this.push(context);
  }

  /**
   * Attaches (or, with `null`, detaches) the signed-in user. Called on login,
   * on logout, and on the restored session at start.
   */
  setUser(user: User | null): void {
    this.setContext({
      user_id: user ? String(user.id) : undefined,
      user_country: user ? (user.country ?? '(not set)') : undefined,
      user_auth_method: user ? (user.has_password ? 'email' : 'google') : undefined,
    });
  }

  /**
   * Marks this browser as ours, so GA4 can filter it out. Set for a signed-in
   * employee and for anyone who has opened the site with `?bhm_internal=on`.
   */
  setTrafficType(internal: boolean): void {
    this.setContext({ traffic_type: internal ? 'internal' : undefined });
  }

  /**
   * The page view for the navigation that just ended.
   *
   * A microtask later, so a page that sets its title on this same
   * `NavigationEnd` is reported under the new title rather than the previous
   * page's. A blog page's title arrives with the API answer, later still, so
   * there the report waits for the title to change — or two seconds, whichever
   * comes first.
   */
  reportNavigation(): void {
    if (!this.enabled) return;

    const attempt = ++this.pageViewPending;
    queueMicrotask(() => {
      const late = TITLE_ARRIVES_LATE.test(location.pathname) && document.title === this.lastTitle;
      if (!late) {
        this.sendPageView(attempt);
        return;
      }

      const titleElement = document.querySelector('title');
      if (!titleElement) {
        this.sendPageView(attempt);
        return;
      }

      const observer = new MutationObserver(() => {
        observer.disconnect();
        clearTimeout(timer);
        this.sendPageView(attempt);
      });
      observer.observe(titleElement, { childList: true, subtree: true, characterData: true });
      const timer = setTimeout(() => {
        observer.disconnect();
        this.sendPageView(attempt);
      }, TITLE_WAIT_MS);
    });
  }

  /**
   * One document-level listener rather than a directive on every link: the
   * store badges, the register CTAs and the blog's own links are plain anchors
   * in section configs that do not know analytics exists.
   */
  trackClicks(): void {
    if (!this.enabled) return;

    document.addEventListener(
      'click',
      (e) => {
        const target = e.target as Element | null;
        const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
        if (!anchor) return;

        const href = anchor.getAttribute('href') ?? '';
        const page_path = location.pathname;
        const text = anchor.textContent?.trim().slice(0, 60) ?? '';

        if (href.includes('play.google.com')) {
          this.event('app_store_click', { store: 'google_play', page_path });
        } else if (href.includes('apps.apple.com')) {
          this.event('app_store_click', { store: 'app_store', page_path });
        } else if (href === '/auth/register') {
          this.event('cta_click', { cta_text: text, page_path });
        } else if (anchor.classList.contains('post-filter__chip')) {
          this.event('select_content', { content_type: 'blog_category', item_id: href, page_path });
        } else if (href.startsWith('/blog/') && target?.closest?.('.post-list__item')) {
          this.event('select_content', { content_type: 'blog_post', item_id: href, page_path });
        } else if (PRODUCT_PATHS.test(href) && target?.closest?.('.prose')) {
          this.event('select_content', { content_type: 'product_page', item_id: href, page_path });
        }
      },
      { capture: true, passive: true },
    );
  }

  private sendPageView(attempt: number): void {
    // A newer navigation has started; that one reports, this one drops.
    if (attempt !== this.pageViewPending) return;

    this.lastTitle = document.title;
    this.setContext({
      page_type: this.pageType(),
      content_group: this.contentGroup(),
    });
    this.event('page_view', {
      page_location: location.href,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
    });
  }

  /** The kind of page, with the 404 marker taking precedence over the path. */
  private pageType(): string {
    const status = document
      .querySelector('meta[name="x-render-status"]')
      ?.getAttribute('content');
    if (status === '404') return 'not_found';
    if (status === '503') return 'unavailable';

    const path = location.pathname.replace(/\/+$/, '') || '/';
    return PAGE_TYPES.find(({ match }) => match.test(path))?.type ?? 'other';
  }

  /**
   * GA4's content grouping. The blog's category, taken from the page rather
   * than from the component, so no page has to know analytics exists: an
   * article links to its own category in its header, an archive is its URL.
   */
  private contentGroup(): string | undefined {
    const path = location.pathname;
    if (path.startsWith('/blog/category/')) return path.split('/')[3];
    if (path.startsWith('/blog/')) {
      const link = document.querySelector('.article__header a[href^="/blog/category/"]');
      return link?.getAttribute('href')?.split('/')[3];
    }
    return undefined;
  }

  private push(payload: Record<string, unknown>): void {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(payload);
  }
}
