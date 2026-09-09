import { ImageConfig } from '../../ui/image/image.model';

/**
 * One row of the blog index, mapped from the API's `ArticleModel`. It is the
 * card's shape, not the article's: pre-formatted strings, nothing the row does
 * not draw.
 */
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** Display form, e.g. "28 August 2026". `datePublished` is the machine one. */
  date: string;
  /** ISO 8601, for `BlogPosting.datePublished`. */
  datePublished: string;
  tag?: string;
  readingTime?: string;
  image?: ImageConfig;
}

/**
 * A category chip. It is a link, not a filter button: each category is its own
 * indexable archive page, so filtering the list in place would hide four pages
 * of content behind one URL.
 */
export interface PostChip {
  label: string;
  routerLink: string;
  active: boolean;
}
