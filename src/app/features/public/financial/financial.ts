import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of } from 'rxjs';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { TextCenterColumnComponent } from '../../../shared/components/info-sections/text-center-column/text-center-column';
import { FeaturesListCtaComponent } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaLink } from '../../../shared/components/ui/link-button/link-button.model';
import { FeatureItem } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta.model';
import { InfoColumnItem } from '../../../shared/components/info-sections/info-columns/info-columns.model';

interface TextCenterColumnData {
  title: string;
  subtitle: string;
  image: ImageConfig;
}

interface FinancialPageData {
  hero: { title: string; subtitle: string; image: ImageConfig; primaryCta: CtaLink; secondaryCta: CtaLink };
  textCenterColumns: TextCenterColumnData[];
  featuresListCta: { title: string; items: FeatureItem[]; ctaHref: string; ctaLabel: string };
  infoColumns: { title: string; items: InfoColumnItem[] };
  ctaBanner: { title: string; description: string; cta: CtaLink };
}

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [AsyncPipe, HeroCenterContentComponent, TextCenterColumnComponent, FeaturesListCtaComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './financial.html',
  styleUrl: './financial.scss',
})
export class FinancialComponent {
  readonly pageData$ = of<FinancialPageData>({
    hero: {
      title: 'Streamline your income with Beehivemind software',
      subtitle: 'We know what you need to manage your business costs more efficiently. With our financial tool you can get views of where your cash is going and manage your numbers effortlessly.',
      image: { src: 'assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221 },
      primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline' },
    },
    textCenterColumns: [
      {
        title: 'Personalize your financial profile',
        subtitle: 'Set cost categories adding their name, description and type. Then use our financial tool to insert your business costs including cost category and amount.',
        image: { src: 'assets/img/financial.gif', alt: 'Financial', width: 477, height: 213 },
      },
      {
        title: 'Get a clear view of your business',
        subtitle: 'The easy to use dashboard will help you measure your business profitability and reduce unnecessary expenses every month. Use the income and outgoing category pies to rocket up your financial.',
        image: { src: 'assets/img/financial.gif', alt: 'Financial', width: 477, height: 213 },
      },
    ],
    featuresListCta: {
      title: 'Meet Beehivemind financial features',
      items: [
        { img: { src: 'assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Costs', description: 'Insert all costs of your business for better control on what\'s coming in and going out.' },
        { img: { src: 'assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Cost Categories', description: 'Create cost categories like jars, feeding, tools, honey, pollen etc to personalize your account.' },
        { img: { src: 'assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Financial chart', description: 'Consult income and outgoing chart to observe how your beekeeping business is performing.' },
        { img: { src: 'assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Financial Pies', description: 'Use costs and cost categories and our financial tool will automatically create pies with categorized data to your account.' },
        { img: { src: 'assets/img/logo1.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Income/Outgoing Pie', description: 'Keep an eye on income/outgoing pie to see the balance between income and expenses of your business.' },
      ],
      ctaHref: 'https://beehivemind.freshdesk.com/support/home',
      ctaLabel: 'Explore the docs',
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
    },
  });
}
