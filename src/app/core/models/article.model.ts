import { SEOApiResponseModel } from './seo.model';

/**
 * One published article, exactly as `PostResource` returns it.
 *
 * Every SEO string arrives finished — the API decides what a post with no meta
 * title or no OG card falls back to — so `SeoService.convertArticleToSeoModel()`
 * can hand this straight to the head without a second set of defaults that
 * could disagree with the sitemap's.
 */
export interface ArticleModel {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  /** Sanitized HTML. Rendered through `[innerHTML]`, which sanitizes again. */
  content: string;
  featured_image: ArticleImage | null;
  author: {
    id: number | null;
    name: string;
  };
  category: ArticleCategory | null;
  tags: string[];
  reading_minutes: number;
  /**
   * The "in short" list and the questions, both rendered visibly on the page.
   * They are the part an answer engine lifts, and Google drops FAQ markup whose
   * answers are not on screen — so they are content, not metadata.
   */
  key_takeaways: string[];
  faq: ArticleFaq[];
  published_at: string;
  updated_at: string;
  seo: SEOApiResponseModel;
}

export interface ArticleImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

/** A category as the blog index and the archive pages list it. */
export interface BlogCategoryModel extends ArticleCategory {
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  post_count?: number;
}
