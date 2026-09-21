import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appStoreUrl, playStoreUrl } from '../../../core/data/app-stores';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  /** Set on store links, for analytics; see `StoreLink.store`. */
  store?: 'google_play' | 'app_store';
}

/**
 * The public footer: a blurb, then Software, How to and Follow us, over a
 * legal line. Content is fixed rather than passed in — it is the same on
 * every page. Styles: styles/components/layout/public-layout.css.
 */
@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-footer.html',
})
export class PublicFooterComponent {
  readonly year = new Date().getFullYear();

  // Store addresses come from core/data/app-stores.ts. "iOS App" opens the
  // Play listing until the iOS build exists (see `appStoreUrl`).
  readonly software: FooterLink[] = [
    { label: 'Features', href: '/features' },
    { label: 'App', href: '/app' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Android App', href: playStoreUrl('footer'), external: true, store: 'google_play' },
    { label: 'iOS App', href: appStoreUrl('footer'), external: true, store: 'app_store' },
    { label: 'Help', href: '/help' },
    { label: 'Contact', href: '/contact' },
  ];

  readonly howTo: FooterLink[] = [
    { label: 'Inspections', href: '/inspections' },
    { label: 'Apiaries & Hives', href: '/apiariesandbeehives' },
    { label: 'Harvest & Feeding', href: '/harvestandfeeding' },
    { label: 'Financial', href: '/financial' },
  ];

  // The LinkedIn company page (linkedin.com/company/beehivemind-beekeeping-software)
  // no longer exists; add it back here and in index.html's `sameAs` once a
  // page is live again. There is no Facebook page and no Twitter/X account,
  // by decision.
  // TikTok is due to become @beehivemindapp, like Instagram, once TikTok
  // allows the rename (2026-10-12); the old address stops resolving then, so
  // change it here and in `sameAs` the same day.
  readonly social: FooterLink[] = [
    { label: 'Instagram', href: 'https://www.instagram.com/beehivemindapp', external: true },
    { label: 'TikTok', href: 'https://www.tiktok.com/@beehivemind.tech', external: true },
    { label: 'Youtube', href: 'https://www.youtube.com/channel/UCSacxrpIMgWoWhLORBY5HcQ', external: true },
  ];

  readonly columns = [
    { heading: 'Software', links: this.software },
    { heading: 'How to', links: this.howTo },
    { heading: 'Follow us', links: this.social },
  ];
}
