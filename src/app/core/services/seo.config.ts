import { SEOModel, SoftwareApplicationSchema } from '../models/seo.model';
import { environment } from '../../../environments/environment';

const BASE = environment.appUrl;
const SITE = environment.appName;

/**
 * Titles lead with what people type, and end with the brand: nobody searches
 * for "BeehiveMind" yet (Search Console: one query, a misspelling), everybody
 * searches for "beekeeping app", "hive inspection app", "apiary management
 * software". Under 60 characters so nothing is cut in the result; descriptions
 * under 155 for the same reason, and each says what the page *does*, since the
 * snippet is the only copy a searcher reads before deciding.
 */

/**
 * The product as an entity, shared by `/` and `/pricing`. Answer engines read
 * this for "what is it, what does it run on, what does it cost" — none of which
 * a WebPage node carries.
 *
 * The prices mirror what `pricing.ts` puts on screen; structured data must not
 * disagree with the visible page. Enterprise is deliberately absent: it is
 * "Talk to us", and an Offer without a price is not one. Likewise the operating
 * systems: the iOS build does not exist yet, so it is not claimed here.
 */
const SOFTWARE_APPLICATION: SoftwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE,
  description:
    'Beehive management software for working beekeepers. Record inspections, harvest, feeding, treatments and costs by voice, offline, from the apiary.',
  url: `${BASE}/`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Android, Web',
  featureList: [
    'Voice-recorded hive inspections',
    'Offline recording with later sync',
    'Apiary and beehive management',
    'Harvest and feeding records',
    'Treatment schedules and reminders',
    'Cost and income tracking',
  ],
  offers: [
    { '@type': 'Offer', name: 'Free',  price: '0', priceCurrency: 'EUR', category: 'free',         url: `${BASE}/pricing` },
    { '@type': 'Offer', name: 'Pro',   price: '9', priceCurrency: 'EUR', category: 'subscription', url: `${BASE}/pricing` },
  ],
  publisher: { '@type': 'Organization', name: SITE, url: BASE },
};

export const SEO_CONFIG: Record<string, SEOModel> = {
  home: {
    meta_title: `Beekeeping App & Hive Management Software | ${SITE}`,
    meta_description: 'Record hive inspections by voice, offline, from the apiary. Track harvest, feeding, treatments and costs per hive. Free for one apiary.',
    focus_keyword: 'beekeeping app, beekeeping software, hive management software, beehive inspection app, apiary management',
    canonical_url: `${BASE}/`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Beekeeping App & Hive Management Software | ${SITE}`,
    og_description: 'Voice-recorded hive inspections, offline. Harvest, feeding, treatments and costs per hive.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Beekeeping App & Hive Management Software | ${SITE}`,
    twitter_description: 'Voice-recorded hive inspections, offline. Harvest, feeding, treatments and costs per hive.',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE,
        url: `${BASE}/`,
        description: 'Beekeeping app and hive management software for working beekeepers',
      },
      SOFTWARE_APPLICATION,
    ],
  },

  features: {
    meta_title: `Beekeeping Software Features | ${SITE}`,
    meta_description: 'Everything BeehiveMind records and shows: voice hive inspections, treatment schedules, harvest and feeding logs, costs, weather per apiary and QR labels.',
    focus_keyword: 'beekeeping software features, hive inspection tracking, treatment reminders, beekeeping records',
    canonical_url: `${BASE}/features`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-features.jpg`,
    og_title: `Beekeeping Software Features | ${SITE}`,
    og_description: 'Voice inspections, treatment schedules, harvest and feeding logs, costs, weather and QR labels.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Beekeeping Software Features | ${SITE}`,
    twitter_description: 'Voice inspections, treatment schedules, harvest and feeding logs, costs, weather and QR labels.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Beekeeping Software Features | ${SITE}`,
      url: `${BASE}/features`,
    },
  },

  blog: {
    meta_title: `Beekeeping Blog: Hive Records & Colony Health | ${SITE}`,
    meta_description: 'Practical beekeeping articles on hive inspections, varroa treatment timing, feeding, harvest records and the cost per hive — written from the apiary.',
    focus_keyword: 'beekeeping blog, hive inspection tips, varroa treatment, beekeeping records',
    canonical_url: `${BASE}/blog`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-blog.jpg`,
    og_title: `Beekeeping Blog: Hive Records & Colony Health | ${SITE}`,
    og_description: 'Practical articles on inspections, treatments, feeding, harvest records and the cost per hive.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Beekeeping Blog | ${SITE}`,
    twitter_description: 'Practical articles on inspections, treatments, feeding, harvest records and the cost per hive.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Beekeeping Blog | ${SITE}`,
      url: `${BASE}/blog`,
      description: 'Practical beekeeping articles on inspections, treatments, records and the cost per hive',
    },
  },

  app: {
    meta_title: `Voice Beekeeping App for Android | ${SITE}`,
    meta_description: 'Say what you see and the inspection writes itself. The BeehiveMind app records hive inspections and harvests by voice, works without signal and syncs later.',
    focus_keyword: 'beekeeping app, hive inspection app, voice beekeeping app, beehive app android',
    canonical_url: `${BASE}/app`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Voice Beekeeping App for Android | ${SITE}`,
    og_description: 'Records hive inspections and harvests by voice, works without signal, syncs later.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Voice Beekeeping App for Android | ${SITE}`,
    twitter_description: 'Records hive inspections and harvests by voice, works without signal, syncs later.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Voice Beekeeping App for Android | ${SITE}`,
      url: `${BASE}/app`,
    },
  },

  apiariesAndBeehives: {
    meta_title: `Apiary Management & Beehive Tracking Software | ${SITE}`,
    meta_description: 'Organise apiaries on a map, create hives in bulk, keep a queen record per hive and print QR labels. Every colony tracked individually with BeehiveMind.',
    focus_keyword: 'apiary management software, beehive tracking app, apiary management app, queen record',
    canonical_url: `${BASE}/apiariesandbeehives`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Apiary Management & Beehive Tracking Software | ${SITE}`,
    og_description: 'Apiaries on a map, hives in bulk, a queen record per hive, QR labels.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Apiary Management & Beehive Tracking | ${SITE}`,
    twitter_description: 'Apiaries on a map, hives in bulk, a queen record per hive, QR labels.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Apiary Management & Beehive Tracking Software | ${SITE}`,
      url: `${BASE}/apiariesandbeehives`,
    },
  },

  financial: {
    meta_title: `Beekeeping Cost & Income Tracking | ${SITE}`,
    meta_description: 'Log expenses and sales by category, see monthly income against outgoings and your cost per hive. Beekeeping business finances in one place.',
    focus_keyword: 'beekeeping cost tracking, apiary financial management, beekeeping business software, cost per hive',
    canonical_url: `${BASE}/financial`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Beekeeping Cost & Income Tracking | ${SITE}`,
    og_description: 'Expenses and sales by category, monthly income against outgoings, cost per hive.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Beekeeping Cost & Income Tracking | ${SITE}`,
    twitter_description: 'Expenses and sales by category, monthly income against outgoings, cost per hive.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Beekeeping Cost & Income Tracking | ${SITE}`,
      url: `${BASE}/financial`,
    },
  },

  harvestAndFeeding: {
    meta_title: `Honey Harvest & Bee Feeding Records | ${SITE}`,
    meta_description: 'Record honey, pollen, propolis and royal jelly harvests per hive or per apiary, log sugar syrup and fondant feedings, and see which colonies produce.',
    focus_keyword: 'honey harvest records, bee feeding log, honey production tracking, beekeeping records app',
    canonical_url: `${BASE}/harvestandfeeding`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Honey Harvest & Bee Feeding Records | ${SITE}`,
    og_description: 'Harvests per hive or apiary, feedings logged, and which colonies actually produce.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Honey Harvest & Bee Feeding Records | ${SITE}`,
    twitter_description: 'Harvests per hive or apiary, feedings logged, and which colonies actually produce.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Honey Harvest & Bee Feeding Records | ${SITE}`,
      url: `${BASE}/harvestandfeeding`,
    },
  },

  inspections: {
    meta_title: `Hive Inspection App & Records | ${SITE}`,
    meta_description: 'Population, brood, stores, queen and varroa recorded by voice in the field, one row per visit. Hive inspection records that show a weak colony weeks earlier.',
    focus_keyword: 'hive inspection app, beehive inspection records, hive inspection checklist, colony health monitoring',
    canonical_url: `${BASE}/inspections`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Hive Inspection App & Records | ${SITE}`,
    og_description: 'Fourteen readings per visit, recorded by voice, shown as one row. Spot a weak colony weeks earlier.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary_large_image',
    twitter_title: `Hive Inspection App & Records | ${SITE}`,
    twitter_description: 'Fourteen readings per visit, recorded by voice, shown as one row. Spot a weak colony weeks earlier.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Hive Inspection App & Records | ${SITE}`,
      url: `${BASE}/inspections`,
    },
  },

  help: {
    meta_title: `Help: Voice Commands & Troubleshooting | ${SITE}`,
    meta_description: 'The ten voice phrases the app understands, the three steps of a recording, and what to do when a phrase is not heard or an inspection has not synced.',
    focus_keyword: 'BeehiveMind help, beekeeping app voice commands, hive inspection app help',
    canonical_url: `${BASE}/help`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Help: Voice Commands & Troubleshooting | ${SITE}`,
    og_description: 'The ten voice phrases, the three steps of a recording, and troubleshooting.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `Help | ${SITE}`,
    twitter_description: 'The ten voice phrases, the three steps of a recording, and troubleshooting.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Help | ${SITE}`,
      url: `${BASE}/help`,
    },
  },

  pricing: {
    meta_title: `Beekeeping Software Pricing: Free & Pro Plans | ${SITE}`,
    meta_description: 'Free forever for one apiary and ten hives. Pro at €9 a month for unlimited apiaries, treatment reminders, finances and weather. No card to start.',
    focus_keyword: 'beekeeping software pricing, beekeeping app free, hive management software plans',
    canonical_url: `${BASE}/pricing`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Beekeeping Software Pricing: Free & Pro Plans | ${SITE}`,
    og_description: 'Free forever for one apiary. Pro at €9 a month for unlimited apiaries. No card to start.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `Plans | ${SITE}`,
    twitter_description: 'Free forever for one apiary. Pro at €9 a month for unlimited apiaries. No card to start.',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Plans | ${SITE}`,
        url: `${BASE}/pricing`,
      },
      SOFTWARE_APPLICATION,
    ],
  },

  about: {
    meta_title: `About BeehiveMind: Beekeeping Software Built in Greece`,
    meta_description: 'Who builds BeehiveMind, why it records by voice, and what we hold ourselves to: your records are yours, it works where the bees are, free stays free.',
    focus_keyword: 'about BeehiveMind, beekeeping software company, beekeeping software Greece',
    canonical_url: `${BASE}/about`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `About | ${SITE}`,
    og_description: 'Who builds BeehiveMind and why it records by voice.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `About | ${SITE}`,
    twitter_description: 'Who builds BeehiveMind and why it records by voice.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: `About | ${SITE}`,
      url: `${BASE}/about`,
    },
  },

  contact: {
    meta_title: `Contact | ${SITE}`,
    meta_description: 'Questions about the software, your account, or something you need it to do. Write to us at info@beehivemind.tech.',
    focus_keyword: 'contact BeehiveMind',
    canonical_url: `${BASE}/contact`,
    robots: 'index, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Contact | ${SITE}`,
    og_description: 'Write to us and we will come back to you.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `Contact | ${SITE}`,
    twitter_description: 'Write to us and we will come back to you.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: `Contact | ${SITE}`,
      url: `${BASE}/contact`,
    },
  },

  terms: {
    meta_title: `Terms of Service | ${SITE}`,
    meta_description: 'The agreement between you and Beehivemind: what we owe you, what you agree to, and what happens to your records.',
    focus_keyword: 'BeehiveMind terms of service',
    canonical_url: `${BASE}/terms`,
    robots: 'noindex, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Terms of Service | ${SITE}`,
    og_description: 'The agreement between you and Beehivemind.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `Terms of Service | ${SITE}`,
    twitter_description: 'The agreement between you and Beehivemind.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Terms of Service | ${SITE}`,
      url: `${BASE}/terms`,
    },
  },

  privacy: {
    meta_title: `Privacy Policy | ${SITE}`,
    meta_description: 'Read the BeehiveMind privacy policy and learn how we protect your data.',
    focus_keyword: 'BeehiveMind privacy policy',
    canonical_url: `${BASE}/privacy`,
    robots: 'noindex, follow',
    image_url: `${BASE}/assets/images/og-home.jpg`,
    og_title: `Privacy Policy | ${SITE}`,
    og_description: 'Read the BeehiveMind privacy policy.',
    og_type: 'website',
    og_locale: 'en_US',
    og_site_name: SITE,
    twitter_card: 'summary',
    twitter_title: `Privacy Policy | ${SITE}`,
    twitter_description: 'Read the BeehiveMind privacy policy.',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `Privacy Policy | ${SITE}`,
      url: `${BASE}/privacy`,
    },
  },
};
