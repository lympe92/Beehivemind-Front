import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, switchMap } from 'rxjs';
import { ArticleModel } from '../../../core/models/article.model';
import { BlogService } from '../../../core/services/blog.service';
import { SeoService } from '../../../core/services/seo.service';
import { SEOModel } from '../../../core/models/seo.model';
import { environment } from '../../../../environments/environment';
import { formatDate } from '../blog/blog.mapper';

/**
 * One post, by slug. The header, hero image and body share the 68ch `.prose`
 * measure; the artwork never upscales past its natural width.
 *
 * `blog/:slug` carries no `seoKey`, so `PublicLayoutComponent` applies nothing
 * here — the article describes itself, through `convertArticleToSeoModel()`,
 * from strings the API has already resolved. It is subscribed rather than
 * `effect`-driven so the tags are emitted during the server render: `paramMap`
 * emits synchronously on subscribe, and again on each in-app navigation between
 * articles (the component instance is reused).
 *
 * The body is written with `[innerHTML]`. The HTML was allowlisted server-side
 * on save and Angular sanitizes it again here.
 */
@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './blog-article.html',
})
export class BlogArticleComponent {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private blog       = inject(BlogService);
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);

  private readonly currentPost = signal<ArticleModel | undefined>(undefined);
  private readonly unavailable = signal(false);

  readonly post = this.currentPost.asReadonly();
  /** The lookup failed, as opposed to the post not existing. */
  readonly isUnavailable = this.unavailable.asReadonly();

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.blog.getPost(params.get('slug') ?? '').pipe(
            map(response => ({ article: response?.data ?? undefined, reachable: true })),
            // A 404 is the ordinary case for a deleted post. Anything else —
            // 5xx, a timeout, no network — means we could not ask, which is a
            // different answer and must not be served as a 404.
            catchError((error: unknown) =>
              of({
                article: undefined,
                reachable: error instanceof HttpErrorResponse && error.status === 404,
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ article, reachable }) => {
        this.currentPost.set(article);
        this.unavailable.set(!article && !reachable);

        if (article) {
          this.seoService.applySEO(this.seoService.convertArticleToSeoModel(article));
          return;
        }
        this.seoService.applySEO(reachable ? this.notFoundSeo() : this.unavailableSeo());
        // Becomes the real response status in server.ts.
        if (reachable) {
          this.seoService.markNotFound();
        } else {
          this.seoService.markUnavailable();
        }
      });
  }

  /** Display date; the machine one goes into the structured data. */
  displayDate(iso: string): string {
    return formatDate(iso);
  }

  /**
   * The post may well exist — we could not ask. No canonical to `/blog`, which
   * would suggest this URL is a duplicate of the index rather than temporarily
   * unreachable; the canonical stays on the article's own address.
   */
  private unavailableSeo(): SEOModel {
    const url = `${environment.appUrl}${this.router.url.split('?')[0]}`;
    const title = `Temporarily unavailable | ${environment.appName}`;
    const text = 'This post could not be loaded just now. Please try again shortly.';
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
    return {
      meta_title: `Post not found | ${environment.appName}`,
      meta_description: 'There is no post at this address. It may have moved.',
      focus_keyword: '',
      canonical_url: url,
      robots: 'noindex, follow',
      image_url: `${environment.appUrl}/assets/images/og-blog.jpg`,

      og_title: `Post not found | ${environment.appName}`,
      og_description: 'There is no post at this address.',
      og_type: 'website',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: 'summary',
      twitter_title: `Post not found | ${environment.appName}`,
      twitter_description: 'There is no post at this address.',

      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Post not found | ${environment.appName}`,
        url,
      },
    };
  }
}
