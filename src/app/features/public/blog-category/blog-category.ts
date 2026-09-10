import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, switchMap } from 'rxjs';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { PostListComponent } from '../../../shared/components/info-sections/post-list/post-list';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig } from '../public-page.model';
import { BlogService } from '../../../core/services/blog.service';
import { SeoService } from '../../../core/services/seo.service';
import { SEOModel } from '../../../core/models/seo.model';
import { ArticleModel, BlogCategoryModel } from '../../../core/models/article.model';
import { Post, PostChip } from '../../../shared/components/info-sections/post-list/post-list.model';
import { environment } from '../../../../environments/environment';
import { INDEXABLE_CATEGORY_MIN_POSTS, toChips, toItemList, toPost } from '../blog/blog.mapper';

/**
 * One category's archive.
 *
 * This page is the reason the index's chips navigate instead of filtering:
 * every category is a URL a search engine can rank for its own subject, with
 * its own title, description and `ItemList`. The console writes those strings —
 * a category carries `meta_title` and `meta_description` of its own.
 *
 * An unknown slug is a 404, marked the same way a missing article is, so
 * `server.ts` returns the status rather than a soft 404.
 */
@Component({
  selector: 'app-blog-category',
  standalone: true,
  imports: [PageIntroComponent, PostListComponent, CtaBannerComponent],
  templateUrl: './blog-category.html',
})
export class BlogCategoryComponent {
  private route      = inject(ActivatedRoute);
  private blog       = inject(BlogService);
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);

  readonly category = signal<BlogCategoryModel | null>(null);
  readonly posts    = signal<Post[]>([]);
  readonly chips    = signal<PostChip[]>([]);
  readonly loaded   = signal(false);
  /** The lookup failed, as opposed to the category not existing. */
  readonly unavailable = signal(false);

  readonly ctaBanner: CtaBannerConfig = {
    title: 'Start keeping better records',
    description: 'Create an account, add your apiaries, and record your next inspection by voice.',
    cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
  };

  constructor() {
    // Subscribed rather than effect-driven, for the same reason the article
    // page is: `paramMap` emits on subscribe, so the tags are in the head
    // during the server render.
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug') ?? '';
          return forkJoin({
            posts: this.blog.getPosts({ category: slug }),
            categories: this.blog.getCategories(),
          }).pipe(map(result => ({ slug, ...result })));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ slug, posts, categories }) => {
          const all = categories.data ?? [];
          const current = all.find(c => c.slug === slug) ?? null;
          const articles = posts.data ?? [];

          this.category.set(current);
          this.posts.set(articles.map(toPost));
          this.chips.set(toChips(all, current ? slug : null));
          this.loaded.set(true);

          this.seoService.applySEO(current ? this.toSeo(current, articles) : this.notFoundSeo());
          if (!current) this.seoService.markNotFound();
        },
        // The category may well exist — the lookup failed. A 404 here would ask
        // Google to drop an archive that is fine, so this is a 503 instead.
        error: () => {
          this.loaded.set(true);
          this.unavailable.set(true);
          this.seoService.applySEO(this.unavailableSeo());
          this.seoService.markUnavailable();
        },
      });
  }

  private toSeo(category: BlogCategoryModel, articles: ArticleModel[]): SEOModel {
    const url = `${environment.appUrl}/blog/category/${category.slug}`;
    const title = category.meta_title ?? `${category.name} | ${environment.appName} blog`;
    const description =
      category.meta_description ??
      category.description ??
      `Articles about ${category.name.toLowerCase()} from the ${environment.appName} blog.`;

    return {
      meta_title: title,
      meta_description: description,
      focus_keyword: category.name,
      canonical_url: url,
      // An archive of one or two teasers is a thin page — and near enough a
      // duplicate of the article it teases — on a domain that has no standing
      // to spend on it yet. It is crawled and its links are followed either
      // way; it enters the index once it has three posts to show. The sitemap
      // in src/server.ts draws the same line.
      robots: articles.length >= INDEXABLE_CATEGORY_MIN_POSTS ? 'index, follow' : 'noindex, follow',
      image_url: `${environment.appUrl}/assets/images/og-blog.jpg`,

      og_title: title,
      og_description: description,
      og_type: 'website',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: 'summary_large_image',
      twitter_title: title,
      twitter_description: description,

      schema: [
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: title,
          url,
          description,
        },
        this.seoService.breadcrumbs([
          { name: 'Blog', url: `${environment.appUrl}/blog` },
          { name: category.name, url },
        ]),
        toItemList(articles),
      ],
    };
  }

  /** An invented category must not be indexed, and must not borrow the last one's tags. */
  /**
   * The canonical stays on this archive's own address, not `/blog` — pointing
   * at the index would say this URL is a duplicate, when all that happened is
   * that the lookup failed.
   */
  private unavailableSeo(): SEOModel {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const url = `${environment.appUrl}/blog/category/${slug}`;
    const title = `Temporarily unavailable | ${environment.appName}`;
    const text = 'This page could not be loaded just now. Please try again shortly.';

    return {
      meta_title: title,
      meta_description: text,
      focus_keyword: '',
      canonical_url: url,
      robots: 'noindex, follow',
      image_url: `${environment.appUrl}/assets/images/og-blog.jpg`,

      og_title: title,
      og_description: text,
      og_type: 'website',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: 'summary',
      twitter_title: title,
      twitter_description: text,

      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url,
      },
    };
  }

  private notFoundSeo(): SEOModel {
    const url = `${environment.appUrl}/blog`;
    const title = `Category not found | ${environment.appName}`;

    return {
      meta_title: title,
      meta_description: 'There is no category at this address. It may have been renamed.',
      focus_keyword: '',
      canonical_url: url,
      robots: 'noindex, follow',
      image_url: `${environment.appUrl}/assets/images/og-blog.jpg`,

      og_title: title,
      og_description: 'There is no category at this address.',
      og_type: 'website',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: 'summary',
      twitter_title: title,
      twitter_description: 'There is no category at this address.',

      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url,
      },
    };
  }
}
