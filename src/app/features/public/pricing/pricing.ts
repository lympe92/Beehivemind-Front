import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { PricingTiersComponent } from '../../../shared/components/cta-sections/pricing-tiers/pricing-tiers';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig, PricingConfig, TextColumnsConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { BillingService } from '../../../core/services/billing.service';
import { FREE_FOR_ALL_NOTE, PLAN_TIERS } from '../../../core/data/plans';
import { faqPageSchema, withFaq } from '../../../core/utils/faq-schema';
import { environment } from '../../../../environments/environment';

interface PricingPageConfig {
  intro: PageIntroConfig;
  pricing: PricingConfig;
  questions: TextColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The plans page. The tiers are `PLAN_TIERS` (core/data/plans.ts), shared
 * with the home page's band. While everything is free for everyone (the admin
 * console's switch) a note above the tiers says so; it is read in the browser,
 * so the prerendered page shows the plans alone.
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
export class PricingComponent implements OnInit {
  private seoService = inject(SeoService);
  private billing = inject(BillingService);
  private platformId = inject(PLATFORM_ID);

  readonly note = signal('');

  readonly page: PricingPageConfig = {
    intro: {
      title: 'Beekeeping software pricing',
      lead: 'Start free with one hive. Every plan has every feature, records by voice, works without signal, and lets you take your data out whenever you want; what a plan adds is hives.',
    },
    pricing: {
      title: 'What each plan holds',
      tiers: PLAN_TIERS,
    },
    // The three questions a plans page has to answer before someone will pick
    // one, and none of them is about features. Phrased as questions because
    // that is what they are — and what the FAQ markup below needs.
    questions: [
      { title: 'Can I change plan later?', description: 'Yes, up or down whenever you like, from your profile. Going down never deletes a record: the hives over your new plan become read-only, your oldest stay as they are, until you remove one or move back up.' },
      { title: 'Who owns my data?', description: 'You do. Every inspection, harvest, feeding and cost you have entered is exportable, on every plan including the free one. Closing an account does not hold your records hostage.' },
      { title: 'How does paying work?', description: 'Monthly, by card through Stripe, and you can stop at the end of any month from your profile. Your team works under the plan of whoever owns it.' },
    ],
    ctaBanner: {
      title: 'What are you waiting for?',
      description: 'The free plan takes a minute to set up and one hive is enough to see whether recording by voice suits how you work.',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    // Built from the questions band, so every question and answer is visible on the page.
    const seo = SEO_CONFIG['pricing'];
    const questions = this.page.questions.map((item) => ({ question: item.title, answer: item.description }));
    const faq = faqPageSchema(`Plans | ${environment.appName}`, '/pricing', seo.meta_description, questions);
    this.seoService.applySEO(withFaq(seo, faq));
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.billing.plans().subscribe(plans => this.note.set(plans.freeForAll ? FREE_FOR_ALL_NOTE : ''));
  }
}
