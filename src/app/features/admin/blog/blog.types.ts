/**
 * The console's view of the blog, in the API's own snake_case — the admin-zone
 * convention (no domain service, no camelCase mapping).
 */

export interface AdminMedia {
  id: number;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  mime: string;
  size: number;
}

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface AdminFaqEntry {
  question: string;
  answer: string;
}

export interface AdminPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  content_json: unknown | null;

  status: PostStatus;
  /** Published *and* past its date — a scheduled post is not live yet. */
  is_live: boolean;
  published_at: string | null;
  reading_minutes: number;

  category_id: number | null;
  category_name: string | null;
  tags: string[];
  author_name: string | null;

  featured_image: AdminMedia | null;
  og_image: AdminMedia | null;

  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  robots: string;
  og_title: string | null;
  og_description: string | null;
  twitter_card: string;

  faq: AdminFaqEntry[];
  key_takeaways: string[];

  created_at: string;
  updated_at: string;
}

export interface AdminBlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sort_order: number;
  post_count?: number;
}

/**
 * The lengths Google truncates at. They are guides, not validation: a title
 * that runs long is still published, it just gets cut in the result.
 */
export const SEO_LIMITS = {
  metaTitle: 60,
  metaDescription: 155,
  excerpt: 400,
} as const;
