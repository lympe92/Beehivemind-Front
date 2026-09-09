import { Component, inject } from '@angular/core';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { PricingTiersComponent } from '../../../shared/components/cta-sections/pricing-tiers/pricing-tiers';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig, PricingConfig, TextColumnsConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { FAQPageSchema } from '../../../core/models/seo.model';
import { environment } from '../../../../environments/environment';

interface PricingPageConfig {
  intro: PageIntroConfig;
  pricing: PricingConfig;
  questions: TextColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The plans page. TODO(content): every figure needs confirming — the tier
 * names are real (the admin panel filters on them); the prices and the limits
 * are the shape the page should have, not agreed numbers.
 *
 * Like `HelpComponent`, it applies its own SEO rather than going through the
 * route's `seoKey`, because the FAQPage node is built from `questions` — the
 * three answers are visible on the page, which is what makes them eligible,
 * and keeping them in one place means the markup cannot drift from the copy.
 */
@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [PageIntroComponent, PricingTiersComponent, TextColumnsComponent, CtaBannerComponent],
  templateUrl: './pricing.html',
})
export class PricingComponent {
  private seoService = inject(SeoService);

  readonly page: PricingPageConfig = {
    intro: {
      title: 'Plans',
      lead: 'Start free and stay free if one apiary is all you keep. Every plan records by voice, works without signal, and lets you take your data out whenever you want.',
    },
    pricing: {
      title: 'What each plan lifts',
      tiers: [
        {
          name: 'Free',
          price: '€0',
          period: 'forever',
          forWhom: 'One apiary, for a beekeeper starting out.',
          includes: ['1 apiary, up to 10 hives', 'Voice inspections and harvest', 'Offline recording', 'Your data exportable at any time'],
          cta: { label: 'Create an account', routerLink: '/auth/register' },
        },
        {
          name: 'Pro',
          price: '€9',
          period: '/ month',
          featured: true,
          forWhom: 'The working beekeeper, one to twenty apiaries.',
          includes: ['Unlimited apiaries and hives', 'Treatment schedules and reminders', 'Financial tracking by category', 'Weather per apiary', 'QR labels for every hive'],
          cta: { label: 'Start with Pro', routerLink: '/auth/register' },
        },
        {
          name: 'Enterprise',
          price: 'Talk to us',
          forWhom: 'Cooperatives and operations with staff.',
          includes: ['Everything in Pro', 'Several users on one operation', 'Per-user roles and permissions', 'Bulk import of existing records', 'Support with setup'],
          cta: { label: 'Contact us', routerLink: '/contact' },
        },
      ],
    },
    // The three questions a plans page has to answer before someone will pick
    // one, and none of them is about features. Phrased as questions because
    // that is what they are — and what the FAQ markup below needs.
    questions: [
      { title: 'Can I change plan later?', description: 'Yes, up or down whenever you like, from your profile. Going down never deletes a record — the apiaries over your new limit become read-only until you remove one or move back up.' },
      { title: 'Who owns my data?', description: 'You do. Every inspection, harvest, feeding and cost you have entered is exportable, on every plan including the free one. Closing an account does not hold your records hostage.' },
      { title: 'How does paying work?', description: 'Monthly, and you can stop at the end of any month. Coupons apply at checkout if you have one from a cooperative or an event.' },
    ],
    ctaBanner: {
      title: 'What are you waiting for?',
      description: 'The free plan takes a minute to set up and one apiary is enough to see whether recording by voice suits how you work.',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const base = SEO_CONFIG['pricing'];
    const pageSchema = Array.isArray(base.schema) ? base.schema : [base.schema];
    this.seoService.applySEO({ ...base, schema: [...pageSchema, this.faqSchema()] });
  }

  /** Built from the questions band, so every question and answer is visible on the page. */
  private faqSchema(): FAQPageSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: `Plans | ${environment.appName}`,
      url: `${environment.appUrl}/pricing`,
      description: SEO_CONFIG['pricing'].meta_description,
      mainEntity: this.page.questions.map(item => ({
        '@type': 'Question' as const,
        name: item.title,
        acceptedAnswer: { '@type': 'Answer' as const, text: item.description },
      })),
    };
  }
}
