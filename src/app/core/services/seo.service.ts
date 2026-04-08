import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SchemaModel, SEOModel } from '../models/seo.model';
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

  applySEO(seo: SEOModel): void {
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
    this.metaService.updateTag({ property: 'og:url', content: seo.canonical_url });
    this.metaService.updateTag({ property: 'og:locale', content: seo.og_locale ?? 'el_GR' });
    this.metaService.updateTag({ property: 'og:site_name', content: seo.og_site_name ?? environment.appName });

    // Twitter
    this.metaService.updateTag({ name: 'twitter:card', content: seo.twitter_card });
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

  convertArticleToSeoModel(article: ArticleModel): SEOModel {
    const imageUrl = article.featured_image?.url ?? `${environment.appUrl}/assets/images/og-blog.jpg`;

    return {
      meta_title: article.seo.meta_title,
      meta_description: article.seo.meta_description,
      focus_keyword: article.seo.focus_keyword,
      canonical_url: article.seo.canonical_url,
      robots: article.seo.robots,
      image_url: imageUrl,

      og_title: article.seo.og_title,
      og_description: article.seo.og_description,
      og_type: 'article',
      og_locale: 'el_GR',
      og_site_name: environment.appName,

      twitter_card: article.seo.twitter_card,
      twitter_title: article.seo.twitter_title,
      twitter_description: article.seo.twitter_description,

      article_published_time: article.published_at,
      article_modified_time: article.updated_at,
      article_author: article.author.name,
      article_section: article.category?.name,
      article_tags: article.tags,

      schema: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        description: article.excerpt,
        url: article.seo.canonical_url,
        image: imageUrl ? [imageUrl] : undefined,
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

  private addSchema(schema: SchemaModel): void {
    const existing = this.doc.querySelector('script[type="application/ld+json"][data-seo]');
    if (existing) {
      existing.remove();
    }
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'true');
    script.text = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }
}