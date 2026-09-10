import { ArticleModel, BlogCategoryModel } from '../../../core/models/article.model';
import { Post, PostChip } from '../../../shared/components/info-sections/post-list/post-list.model';
import { ItemListSchema } from '../../../core/models/seo.model';
import { environment } from '../../../../environments/environment';

/**
 * The blog index and every category archive draw the same list from the same
 * API shape, so the three things they all need live here rather than twice.
 */

/**
 * How many posts an archive page needs before it is worth indexing. Below
 * this it is served with `noindex, follow` and left out of the sitemap; the
 * same number lives in src/server.ts, which cannot import from here.
 */
export const INDEXABLE_CATEGORY_MIN_POSTS = 3;

/**
 * The product page each category is really about — the link at the foot of
 * an article, and the "from the blog" link on the product page. A slug that is
 * not listed maps to nothing rather than to a guess.
 */
const PRODUCT_PAGES: Record<string, { label: string; routerLink: string }> = {
  inspections: { label: 'How BeehiveMind records an inspection', routerLink: '/inspections' },
  'the-app':   { label: 'The BeehiveMind app', routerLink: '/app' },
  treatments:  { label: 'Treatment schedules in BeehiveMind', routerLink: '/features' },
  financial:   { label: 'Cost and income tracking in BeehiveMind', routerLink: '/financial' },
  apiaries:    { label: 'Apiaries and beehives in BeehiveMind', routerLink: '/apiariesandbeehives' },
  harvest:     { label: 'Harvest and feeding records in BeehiveMind', routerLink: '/harvestandfeeding' },
  feeding:     { label: 'Harvest and feeding records in BeehiveMind', routerLink: '/harvestandfeeding' },
};

export function productPageFor(categorySlug: string | undefined): { label: string; routerLink: string } | null {
  return categorySlug ? (PRODUCT_PAGES[categorySlug] ?? null) : null;
}

/** The API's article, as one row of the index. */
export function toPost(article: ArticleModel): Post {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    date: formatDate(article.published_at),
    datePublished: article.published_at,
    tag: article.category?.name,
    readingTime: `${article.reading_minutes} min read`,
    // The row reserves space from the dimensions, so an image whose size the
    // upload could not read is left out rather than allowed to reflow the list.
    image:
      article.featured_image?.width && article.featured_image.height
        ? {
            src: article.featured_image.url,
            alt: article.featured_image.alt,
            width: article.featured_image.width,
            height: article.featured_image.height,
          }
        : undefined,
  };
}

/** "All" first, then the categories that actually have something in them. */
export function toChips(categories: BlogCategoryModel[], activeSlug: string | null): PostChip[] {
  return [
    { label: 'All', routerLink: '/blog', active: activeSlug === null },
    ...categories
      .filter(category => (category.post_count ?? 0) > 0)
      .map(category => ({
        label: category.name,
        routerLink: `/blog/category/${category.slug}`,
        active: category.slug === activeSlug,
      })),
  ];
}

/**
 * The articles on the page, in the order they are shown. It is what tells an
 * answer engine that this URL is a list of those articles rather than one long
 * document about them.
 */
export function toItemList(articles: ArticleModel[]): ItemListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: articles.map((article, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${environment.appUrl}/blog/${article.slug}`,
      name: article.title,
    })),
  };
}

/** "28 August 2026" — the form the kit's index row was drawn with. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  // Fixed locale on purpose: the site is English, and the server render must
  // produce the same string as the browser or hydration reports a mismatch.
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
