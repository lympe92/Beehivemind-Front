export interface SEOApiResponseModel {
  canonical_url: string;
  focus_keyword: string;
  meta_description: string;
  meta_title: string;
  og_description: string;
  og_title: string;
  og_type: string;
  robots: string;
  twitter_card: 'summary' | 'summary_large_image';
  twitter_title: string;
  twitter_description: string;
  image_url: string;
}

export interface SEOModel {
  // Meta
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  robots: string;
  image_url: string;

  // Open Graph
  og_title: string;
  og_description: string;
  og_type: 'website' | 'article';
  og_locale?: string;
  og_site_name?: string;

  // Twitter
  twitter_card: 'summary' | 'summary_large_image';
  twitter_title: string;
  twitter_description: string;

  // Article-specific OG (only when og_type === 'article')
  article_published_time?: string;
  article_modified_time?: string;
  article_author?: string;
  article_section?: string;
  article_tags?: string[];

  /** One node, or several — each is emitted as its own `ld+json` script. */
  schema: SchemaModel | SchemaModel[];
}

// --- Schema.org discriminated union ---

interface BaseSchema {
  '@context': 'https://schema.org';
}

export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
}

export interface WebPageSchema extends BaseSchema {
  '@type': 'WebPage' | 'AboutPage' | 'ContactPage';
  name: string;
  url: string;
  description?: string;
}

export interface CollectionPageSchema extends BaseSchema {
  '@type': 'CollectionPage';
  name: string;
  url: string;
  description?: string;
}

export interface BlogPostingSchema extends BaseSchema {
  '@type': 'BlogPosting';
  headline: string;
  description: string;
  url: string;
  image?: string[];
  datePublished: string;
  dateModified: string;
  // Posts written under the company byline use Organization; a named byline
  // (the CMS shape in `convertArticleToSeoModel`) uses Person.
  author: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
  };
  keywords?: string;
  articleSection?: string;
}

/** One plan. Schema.org wants a price on an Offer, so a "talk to us" tier has none. */
export interface OfferSchema {
  '@type': 'Offer';
  name: string;
  price: string;
  priceCurrency: string;
  url?: string;
  category?: string;
}

/**
 * The product itself, as an entity rather than a page. This is the node answer
 * engines read for "what is it, what does it run on, what does it cost".
 */
export interface SoftwareApplicationSchema extends BaseSchema {
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: OfferSchema[];
  featureList?: string[];
  publisher?: { '@type': 'Organization'; name: string; url?: string };
}

export interface QuestionSchema {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
}

/**
 * Only for pages where the questions and answers are both visible on the page —
 * Google drops the markup otherwise.
 */
export interface FAQPageSchema extends BaseSchema {
  '@type': 'FAQPage';
  name: string;
  url: string;
  description?: string;
  mainEntity: QuestionSchema[];
}

/**
 * The trail a reader (and a crawler) walked to reach the page. Emitted on the
 * blog's article and archive pages, where the path is real: Home › Blog ›
 * Category › Article.
 */
export interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

/** The articles on an index or archive page, in the order they are shown. */
export interface ItemListSchema extends BaseSchema {
  '@type': 'ItemList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    url: string;
    name: string;
  }[];
}

export type SchemaModel =
  | WebSiteSchema
  | WebPageSchema
  | CollectionPageSchema
  | BlogPostingSchema
  | SoftwareApplicationSchema
  | FAQPageSchema
  | BreadcrumbListSchema
  | ItemListSchema;
