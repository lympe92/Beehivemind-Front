import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
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
  private blog       = inject(BlogService);
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);

  private readonly currentPost = signal<ArticleModel | undefined>(undefined);

  readonly post = this.currentPost.asReadonly();

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params =>
          this.blog.getPost(params.get('slug') ?? '').pipe(
            // A 404 here is the ordinary case for a deleted post, not a fault.
            catchError(() => of(null)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(response => {
        const article = response?.data ?? undefined;
        this.currentPost.set(article);
        this.seoService.applySEO(
          article ? this.seoService.convertArticleToSeoModel(article) : this.notFoundSeo(),
        );
        // Turns this render into a 404 response instead of a soft 404.
        if (!article) this.seoService.markNotFound();
      });
  }

  /** Display date; the machine one goes into the structured data. */
  displayDate(iso: string): string {
    return formatDate(iso);
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
