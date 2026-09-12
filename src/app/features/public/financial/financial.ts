import { Component, inject } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { TextCenterColumnComponent } from '../../../shared/components/info-sections/text-center-column/text-center-column';
import { FeaturesListCtaComponent } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import {
  CtaBannerConfig,
  FeaturesListCtaConfig,
  HeroConfig,
  InfoColumnsConfig,
  SplitAccordionConfig,
  TextCenterColumnConfig,
} from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';

interface FinancialPageConfig {
  hero: HeroConfig;
  textCenterColumns: TextCenterColumnConfig[];
  featuresListCta: FeaturesListCtaConfig;
  questions: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

const LOGO: ImageConfig = { src: '/assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 };
const FINANCIAL_GIF: ImageConfig = { src: '/assets/img/financial.webp', alt: 'Financial', width: 477, height: 213 };

/**
 * Applies its own SEO rather than the route's `seoKey`, like `/pricing` and
 * `/help`: the FAQPage node is built from `questions`, the band the page shows.
 */
@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [HeroCenterContentComponent, TextCenterColumnComponent, FeaturesListCtaComponent, SplitAccordionComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './financial.html',
})
export class FinancialComponent {
  private seoService = inject(SeoService);

  readonly page: FinancialPageConfig = {
    hero: {
      title: 'Beekeeping costs and income, per hive',
      subtitle: 'We know what you need to manage your business costs more efficiently. With our financial tool you can get views of where your cash is going and manage your numbers effortlessly.',
      image: { src: '/assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    textCenterColumns: [
      {
        title: 'Personalize your financial profile',
        subtitle: 'Set cost categories adding their name, description and type. Then use our financial tool to insert your business costs including cost category and amount.',
        image: FINANCIAL_GIF,
      },
      {
        title: 'Get a clear view of your business',
        subtitle: 'The easy to use dashboard will help you measure your business profitability and reduce unnecessary expenses every month. Use the income and outgoing category pies to rocket up your financial.',
        image: FINANCIAL_GIF,
      },
    ],
    // Six items, so the three-up grid has no orphan.
    featuresListCta: {
      title: 'Meet Beehivemind financial features',
      items: [
        { img: LOGO, title: 'Costs', description: "Insert all costs of your business for better control on what's coming in and going out." },
        { img: LOGO, title: 'Cost Categories', description: 'Create cost categories like jars, feeding, tools, honey, pollen etc to personalize your account.' },
        { img: LOGO, title: 'Financial chart', description: 'Consult income and outgoing chart to observe how your beekeeping business is performing.' },
        { img: LOGO, title: 'Financial Pies', description: 'Use costs and cost categories and our financial tool will automatically create pies with categorized data to your account.' },
        { img: LOGO, title: 'Income/Outgoing Pie', description: 'Keep an eye on income/outgoing pie to see the balance between income and expenses of your business.' },
        { img: LOGO, title: 'Financial Reports', description: 'Filter your costs by period and category, then export the summary to keep your bookkeeping in order.' },
      ],
      ctaHref: '/help',
      ctaLabel: 'Read the help page',
    },
    // The categories answer is what the cost-category form takes (name,
    // description, income or outgoing); the rest are the money questions
    // people search, each ending in the article that answers them.
    questions: {
      title: 'Common questions',
      image: { src: '/assets/img/jar.webp', alt: 'Honey jar with a cloth cover', width: 417, height: 417 },
      items: [
        {
          title: 'What counts as a beekeeping cost?',
          body: 'Everything that grows with the number of hives: sugar, treatments, frames and foundation, queens, jars and labels. Then the fixed costs such as insurance and association fees, and the losses, because a colony lost over winter is a nucleus to buy or a split to make.',
          linkHref: '/blog/what-beekeeping-costs',
          linkLabel: 'What beekeeping costs per hive »',
        },
        {
          title: 'Can I set up my own categories?',
          body: 'Yes. Name a category, describe it and mark it as income or outgoing, then file every cost and sale under it. The charts split the year by those categories, so set them up the way you think about the apiary.',
        },
        {
          title: 'Is beekeeping profitable?',
          body: 'At hobby scale, rarely once equipment and time are counted; the honey usually covers the running costs. It turns into a business past a few dozen hives sold direct, and from there the margin depends on what a kilo costs you to produce and the price you set.',
          linkHref: '/blog/beekeeping-business',
          linkLabel: 'The numbers behind a beekeeping business »',
        },
        {
          title: 'How should I price my honey?',
          body: 'Start from what a kilo costs you, jars and labels included, then look at what local honey sells for at markets and farm shops rather than on supermarket shelves. Honey sold direct in jars usually earns several times the bulk price.',
        },
      ],
    },
    infoColumns: {
      title: 'Trusted partner',
      items: [
        { title: '1.000+', description: 'Customers' },
        { title: '10.000+', description: 'Social followers' },
        { title: '3 years', description: 'Online' },
      ],
    },
    ctaBanner: {
      title: 'What are you waiting for?',
      description: "That's right, what are you waiting for? The only thing left to do is to register and download BeehiveMind App today!",
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
      secondary: { label: 'From the blog: beekeeping finances »', routerLink: '/blog/category/financial' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const seo = SEO_CONFIG['financial'];
    const faq = faqPageSchema(seo.meta_title, '/financial', seo.meta_description, this.page.questions.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }
}
