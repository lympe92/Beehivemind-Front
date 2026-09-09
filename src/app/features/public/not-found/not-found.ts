import { Component, inject } from '@angular/core';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { environment } from '../../../../environments/environment';

interface NotFoundPageConfig {
  intro: PageIntroConfig;
  cta: CtaBannerConfig;
}

/**
 * The 404. It sits inside the public shell so a wrong address still lands on a
 * page with the header, the footer and a way back, rather than a bare Express
 * error or — as it did before — a silent redirect to the home page, which
 * Google reads as a soft 404.
 *
 * The status code comes from `app.routes.server.ts`, where the catch-all server
 * route carries `status: 404`. The page also marks itself, so it still resolves
 * to a 404 if it is ever reached through a route that does not.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [PageIntroComponent, CtaBannerComponent],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  private seoService = inject(SeoService);

  readonly page: NotFoundPageConfig = {
    intro: {
      eyebrow: 'Error 404',
      title: 'There is nothing at this address',
      lead: 'The page may have moved, or the link that brought you here may be wrong. The main sections are in the menu above.',
    },
    cta: {
      title: 'Start from the beginning',
      description: 'The home page has the short version of what Beehivemind does.',
      cta: { label: 'Go to the home page', routerLink: '/', variant: 'outline' },
    },
  };

  constructor() {
    this.seoService.applySEO({
      meta_title: `Page not found | ${environment.appName}`,
      meta_description: 'There is nothing at this address.',
      focus_keyword: '',
      canonical_url: `${environment.appUrl}/`,
      robots: 'noindex, follow',
      image_url: `${environment.appUrl}/assets/images/og-home.jpg`,

      og_title: `Page not found | ${environment.appName}`,
      og_description: 'There is nothing at this address.',
      og_type: 'website',
      og_locale: 'en_US',
      og_site_name: environment.appName,

      twitter_card: 'summary',
      twitter_title: `Page not found | ${environment.appName}`,
      twitter_description: 'There is nothing at this address.',

      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Page not found | ${environment.appName}`,
        url: `${environment.appUrl}/`,
      },
    });
    this.seoService.markNotFound();
  }
}
