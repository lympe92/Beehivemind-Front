/**
 * Where the mobile app is installed from. Every store link on the site is built
 * here, so the listing's address lives in one place.
 *
 * The Android app ships as `tech.beehivemind.app` (live on Google Play since
 * 2026-09-21). The package was `org.beehivemind` until 2026-09-10; that listing
 * no longer exists, and links to it answer 404. The iOS app has the same bundle
 * id and is live on the App Store since 2026-11-13.
 */
export const PLAY_STORE_ID = 'tech.beehivemind.app';

/** The listing itself, untagged: for structured data and llms.txt. */
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;

/**
 * A listing link that says where on the site it was clicked. Play reads the
 * UTM tags from the URL-encoded `referrer` parameter (the Google Play URL
 * Builder format) and reports them in Play Console under Acquisition →
 * Tracked channels (UTM), by source and campaign.
 */
export function playStoreUrl(placement: string): string {
  const referrer = `utm_source=beehivemind.tech&utm_medium=website&utm_campaign=${placement}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

export const APP_STORE_ID = '6823513022';

/**
 * The App Store listing, untagged. Without a country in the path Apple sends
 * each visitor to their own storefront.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

/**
 * The App Store link for a badge. It is the bare listing for now: Apple
 * attributes a click to a campaign only when the link carries the account's
 * provider id (`pt`) beside the campaign (`ct`), and a `ct` alone is dropped.
 * When the provider id is known (App Store Connect → Analytics → campaign
 * link), add `?pt=…&ct=${placement}&mt=8` here and every badge follows. Until
 * then the placement is read from GA4's `app_store_click` (`page_path`).
 */
export function appStoreUrl(_placement: string): string {
  return APP_STORE_URL;
}
