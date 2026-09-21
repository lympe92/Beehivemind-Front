import { appStoreUrl, playStoreUrl } from '../../../../core/data/app-stores';
import { StoreLink } from './application-download.model';

/**
 * The two store badges, for a download band. Both SVGs are the vendors' own
 * artwork at 135 × 40, drawn here at 162 × 48 — the band's CSS fixes the height
 * and takes the width from these attributes, so they must keep that ratio.
 *
 * `placement` names the band in the listing link's UTM campaign.
 */
export function storeBadges(placement: string): StoreLink[] {
  return [
    {
      href: playStoreUrl(placement),
      store: 'google_play',
      img: { src: '/assets/icons/android.svg', alt: 'Get it on Google Play', width: 162, height: 48 },
    },
    {
      href: appStoreUrl(placement),
      store: 'app_store',
      img: { src: '/assets/icons/apple-store.svg', alt: 'Download on the App Store', width: 162, height: 48 },
    },
  ];
}
