import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { BreadcrumbListSchema, SchemaModel, SEOModel } from '../models/seo.model';
import { ArticleModel } from '../models/article.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private doc: Document,
  ) {}

  /**
   * Read by server.ts, which turns it into the real response status.
   *
   * `ServerRoute.status` is fixed per route, so it cannot help a route whose
   * content is looked up at render time: a real blog slug and an invented one
   * share a route, and so does a slug the API simply failed to answer for.
   * Such a page calls `markNotFound()` or `markUnavailable()` after `applySEO()`.
   */
  static readonly RENDER_STATUS_MARKER = 'x-render-status';

  applySEO(seo: SEOModel): void {
    // Cleared on every page so a marker cannot outlive the page that set it.
    this.clearNotFound();

    // Meta tags
    this.titleService.setTitle(seo.meta_title);
    this.metaService.updateTag({ name: 'description', content: seo.meta_description });
    this.metaService.updateTag({ name: 'keywords', content: seo.focus_keyword });
    this.metaService.updateTag({ name: 'robots', content: seo.robots });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: seo.og_title });
    this.metaService.updateTag({ property: 'og:description', content: seo.og_description });
    this.metaService.updateTag({ property: 'og:type', content: seo.og_type });
    this.metaService.updateTag({ property: 'og:image', content: seo.image_url });
    // The cards are built at 1200x630 by tools/build-og.mjs. Several crawlers
    // lay out the preview from these rather than fetching the image first.
    this.metaService.updateTag({ property: 'og:image:width', content: '1200' });
    this.metaService.updateTag({ property: 'og:image:height', content: '630' });
    this.metaService.updateTag({ property: 'og:url', content: seo.canonical_url });
    // en_US, matching <html lang="en">. The site is English throughout; a page
    // that forgets to set this must not declare a different language than the
    // one it is written in.
    this.metaService.updateTag({ property: 'og:locale', content: seo.og_locale ?? 'en_US' });
    this.metaService.updateTag({ property: 'og:site_name', content: seo.og_site_name ?? environment.appName });

    // Twitter
    this.metaService.updateTag({ name: 'twitter:card', content: seo.twitter_card });
    this.metaService.updateTag({ name: 'twitter:site', content: '@Beehivemind_org' });
    this.metaService.updateTag({ name: 'twitter:title', content: seo.twitter_title });
    this.metaService.updateTag({ name: 'twitter:description', content: seo.twitter_description });
    this.metaService.updateTag({ name: 'twitter:image', content: seo.image_url });

    // Article-specific OG tags
    if (seo.og_type === 'article') {
      this.applyArticleOGTags(seo);
    }

    // Canonical
    this.setCanonicalURL(seo.canonical_url);

    // Schema
    this.addSchema(seo.schema);
  }

  /**
   * The record behind the route genuinely does not exist — deleted, or never
   * existed. A 404 tells Google to drop it, which is what we want here.
   */
  markNotFound(): void {
    this.setRenderStatus(404);
  }

  /**
   * The record could not be looked up: the API is down, timed out, or answered
   * 5xx. Emphatically not a 404 — that would ask Google to remove a page that
   * still exists, and a few hours of downtime would cost the whole blog its
   * indexing. 503 is the "try again later" that costs nothing.
   */
  markUnavailable(): void {
    this.setRenderStatus(503);
  }

  private setRenderStatus(status: 404 | 503): void {
    this.metaService.updateTag({
      name: SeoService.RENDER_STATUS_MARKER,
      content: String(status),
    });
  }

  private clearNotFound(): void {
    this.metaService.removeTag(`name="${SeoService.RENDER_STATUS_MARKER}"`);
  }

  /**
   * Turns one article into everything the head needs.
   *
   * The meta strings are taken as they come — the API resolves a post's
   * fallbacks (no meta title, no OG card of its own), so the sitemap, the
   * console's preview and this all describe the post identically.
   *
   * Three schema nodes rather than one. `BlogPosting` is the article;
   * `BreadcrumbList` is the path a crawler can attribute the page to; the
   * `FAQPage` is emitted only when the post actually carries questions, because
   * the page renders those questions and Google drops markup that is not on
   * screen.
   */
  convertArticleToSeoModel(article: ArticleModel): SEOModel {
    const url = article.seo.canonical_url;
    const image = article.seo.image_url;

    const schema: SchemaModel[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt,
        url,
        image: image ? [image] : undefined,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        author: {
          '@type': 'Person',
          name: article.author.name,
        },
        publisher: {
          '@type': 'Organization',
          name: environment.appName,
        },
        keywords: article.tags.length ? article.tags.join(', ') : undefined,
        articleSection: article.category?.name,
      },
      this.breadcrumbs([
        { name: 'Blog', url: `${environment.appUrl}/blog` },
        ...(article.category
          ? [{ name: article.category.name, url: `${environment.appUrl}/blog/category/${article.category.slug}` }]
          : []),
        { name: article.title, url },
      ]),
    ];

    if (article.faq.length) {
      schema.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        name: article.title,
        url,
        mainEntity: article.faq.map(entry => ({
          '@type': 'Question' as const,
          name: entry.question,
          acceptedAnswer: { '@type': 'Answer' as const, text: entry.answer },
        })),
      });
    }

    return {
      meta_title: article.seo.meta_title,
      meta_description: article.seo.meta_description,
      focus_keyword: article.seo.focus_keyword,
      canonical_url: url,
      robots: article.seo.robots,
      image_url: image,

      og_title: article.seo.og_title,
      og_description: article.seo.og_description,
      og_type: 'article',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: article.seo.twitter_card,
      twitter_title: article.seo.twitter_title,
      twitter_description: article.seo.twitter_description,

      article_published_time: article.published_at,
      article_modified_time: article.updated_at,
      article_author: article.author.name,
      article_section: article.category?.name,
      article_tags: article.tags,

      schema,
    };
  }

  /**
   * Home is always the first crumb, so callers pass only the trail below it.
   */
  breadcrumbs(trail: { name: string; url: string }[]): BreadcrumbListSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Home', url: `${environment.appUrl}/` }, ...trail].map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
  }

  private applyArticleOGTags(seo: SEOModel): void {
    if (seo.article_published_time) {
      this.metaService.updateTag({ property: 'article:published_time', content: seo.article_published_time });
    }
    if (seo.article_modified_time) {
      this.metaService.updateTag({ property: 'article:modified_time', content: seo.article_modified_time });
    }
    if (seo.article_author) {
      this.metaService.updateTag({ property: 'article:author', content: seo.article_author });
    }
    if (seo.article_section) {
      this.metaService.updateTag({ property: 'article:section', content: seo.article_section });
    }
    // `addTag` appends, so tags from the previously viewed article would pile up
    // on every in-app navigation. Clear them first.
    this.doc.head.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
    seo.article_tags?.forEach(tag => {
      this.metaService.addTag({ property: 'article:tag', content: tag });
    });
  }

  private setCanonicalURL(url: string): void {
    const existing = this.doc.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.remove();
    }
    const link = this.doc.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.doc.head.appendChild(link);
  }

  /**
   * Emits one script per node. Only the `data-seo` ones are cleared, so the
   * sitewide Organization node in index.html survives every navigation.
   */
  private addSchema(schema: SchemaModel | SchemaModel[]): void {
    this.doc
      .querySelectorAll('script[type="application/ld+json"][data-seo]')
      .forEach(el => el.remove());

    for (const node of Array.isArray(schema) ? schema : [schema]) {
      const script = this.doc.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'true');
      script.text = JSON.stringify(node);
      this.doc.head.appendChild(script);
    }
  }
}