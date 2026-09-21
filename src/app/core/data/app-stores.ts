/**
 * Where the mobile app is installed from. Every store link on the site is built
 * here, so the listing's address lives in one place.
 *
 * The Android app ships as `tech.beehivemind.app` (live on Google Play since
 * 2026-09-21). The package was `org.beehivemind` until 2026-09-10; that listing
 * no longer exists, and links to it answer 404.
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

/**
 * TEMPORARY: there is no iOS build yet, so the App Store badge opens the Play
 * listing. The campaign carries an `_ios` suffix, which keeps App Store clicks
 * apart from Play clicks in Play Console. When the App Store listing exists,
 * return its address here and every App Store badge follows.
 */
export function appStoreUrl(placement: string): string {
  return playStoreUrl(`${placement}_ios`);
}
