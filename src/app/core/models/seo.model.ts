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

  schema: SchemaModel;
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
  author: {
    '@type': 'Person';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
  };
  keywords?: string;
  articleSection?: string;
}

export type SchemaModel = WebSiteSchema | WebPageSchema | CollectionPageSchema | BlogPostingSchema;
