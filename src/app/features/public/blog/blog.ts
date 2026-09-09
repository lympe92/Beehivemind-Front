import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { PostListComponent } from '../../../shared/components/info-sections/post-list/post-list';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig } from '../public-page.model';
import { BlogService } from '../../../core/services/blog.service';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { Post, PostChip } from '../../../shared/components/info-sections/post-list/post-list.model';
import { toChips, toItemList, toPost } from './blog.mapper';

interface BlogPageConfig {
  intro: PageIntroConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The blog index. Posts and categories come from the console through the API;
 * the fetch runs during the server render and the transfer cache hands the
 * result to the browser, so a crawler sees the list in the HTML.
 *
 * The category chips are links to `/blog/category/:slug`, not an in-page
 * filter: four categories filtered client-side would be one URL where there
 * should be five.
 *
 * The route carries `seoKey: 'blog'`, so the layout has already applied the
 * static description by the time the posts land. This adds the one part that
 * cannot be static — the `ItemList` naming the articles actually on the page.
 */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [PageIntroComponent, PostListComponent, CtaBannerComponent],
  templateUrl: './blog.html',
})
export class BlogComponent implements OnInit {
  private blog       = inject(BlogService);
  private seoService = inject(SeoService);
  private destroyRef = inject(DestroyRef);

  readonly page: BlogPageConfig = {
    intro: {
      eyebrow: 'Blog',
      title: 'Notes on keeping bees with better records',
      lead: 'What the data from thousands of inspections tells us, and how to use the app well.',
    },
    ctaBanner: {
      title: 'Start keeping better records',
      description: 'Create an account, add your apiaries, and record your next inspection by voice.',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };

  readonly posts = signal<Post[]>([]);
  readonly chips = signal<PostChip[]>([]);

  ngOnInit(): void {
    forkJoin({
      posts: this.blog.getPosts(),
      categories: this.blog.getCategories(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ posts, categories }) => {
          const articles = posts.data ?? [];
          this.posts.set(articles.map(toPost));
          this.chips.set(toChips(categories.data ?? [], null));

          const base = SEO_CONFIG['blog'];
          this.seoService.applySEO({
            ...base,
            schema: [
              ...(Array.isArray(base.schema) ? base.schema : [base.schema]),
              this.seoService.breadcrumbs([{ name: 'Blog', url: base.canonical_url }]),
              toItemList(articles),
            ],
          });
        },
        // The page still renders its intro and CTA, and the layout's static
        // description is already in the head.
        error: () => {},
      });
  }
}
