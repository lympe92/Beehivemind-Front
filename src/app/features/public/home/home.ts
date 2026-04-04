import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of } from 'rxjs';
import { HeroLeftContentComponent } from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import { RibbonComponent, RibbonMode } from '../../../shared/components/info-sections/ribbon/ribbon';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { FeaturesRowComponent } from '../../../shared/components/cta-sections/features-row/features-row';
import { SplitListComponent } from '../../../shared/components/cta-sections/split-list/split-list';
import { InfoColumnsComponent, InfoColumnsMode } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaLink } from '../../../shared/components/ui/link-button/link-button.model';
import { AccordionItem } from '../../../shared/components/cta-sections/split-accordion/split-accordion.model';
import { FeatureRowItem } from '../../../shared/components/cta-sections/features-row/features-row.model';
import { SplitListItem } from '../../../shared/components/cta-sections/split-list/split-list.model';
import { InfoColumnItem } from '../../../shared/components/info-sections/info-columns/info-columns.model';

interface HomePageData {
  hero: {
    title: string;
    subtitle: string;
    image: ImageConfig;
    primaryCta: CtaLink;
    secondaryCta: CtaLink;
  };
  ribbon1: { mode: RibbonMode; quote: string; author: string };
  splitAccordion: { title: string; image: ImageConfig; items: AccordionItem[] };
  featuresRow: { items: FeatureRowItem[]; cta: CtaLink };
  ribbon2: { mode: RibbonMode; quote: string };
  splitList: { title: string; items: SplitListItem[]; image: ImageConfig; cta: CtaLink };
  infoColumns: { mode: InfoColumnsMode; title: string; items: InfoColumnItem[] };
  ctaBanner: { title: string; description: string; cta: CtaLink };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AsyncPipe, HeroLeftContentComponent, RibbonComponent, SplitAccordionComponent, FeaturesRowComponent, SplitListComponent, InfoColumnsComponent, CtaBannerComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  readonly pageData$ = of<HomePageData>({
    hero: {
      title: 'Most intelligent beekeeping software',
      subtitle: 'Increase your business productivity with our beehive management software.',
      image: { src: 'assets/img/bee4.webp', alt: 'Bee', width: 512, height: 358, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline' },
    },
    ribbon1: {
      mode: 'dark',
      quote: 'This App made my Business easier and funnier. Easy to use, does what it says.',
      author: '-Google Play user',
    },
    splitAccordion: {
      title: 'Turn inspections into knowledge',
      image: { src: 'assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221, priority: true },
      items: [
        {
          title: 'Know your bees right now',
          body: 'Do you know your bees? Use our advanced tools to understand your beehives\' growth, decrease bee colonies mortality rate and promote the genetic improvement of your bee stocks.',
          linkHref: '/features',
          linkLabel: 'Explore the features we offer »',
        },
        {
          title: 'Unified beekeeping management',
          body: 'Get the most out of beekeeping using our voice recognition beehive management system. In this way you can contribute to sustainable beekeeping for a better world.',
          linkHref: '/features',
          linkLabel: 'Explore the features we offer »',
        },
        {
          title: 'Efficient financial management',
          body: 'Beehivemind makes the financial management of your beekeeping business efficient. Manage your business costs more efficiently through our financial management system and grow up while reducing your overall workload.',
          linkHref: '/financial',
          linkLabel: 'Explore the financial mode »',
        },
      ],
    },
    featuresRow: {
      items: [
        { title: 'Optimize your account', description: 'Create your account, add your apiaries, create as many beehives as you want and name groups according to your needs. Now your account is ready to use.' },
        { title: 'Inspect your colonies', description: 'Just open our beekeeping App and work using voice commands during inspection. Once the inspection is over, all data you entered will be available to evaluate them.' },
        { title: 'Analyze inspection data', description: 'Analyze apiary management data to determinate what needs to be better in order to increase the growth rate of your colonies, productivity and healthiness.' },
        { title: 'Diagnose growth issues', description: 'With our beekeeping software you can analyze apiary management data which will help you to understand better the bees, conduct tests and draw useful conclusions.' },
      ],
      cta: { label: 'Explore the features', routerLink: '/features' },
    },
    ribbon2: {
      mode: 'dark',
      quote: 'Being productive is all about using the right tool!',
    },
    splitList: {
      title: "See all info about hives' growth with Beehivemind app",
      items: [
        { title: 'Stay Hands-On', description: 'By using our beekeeping App you remain engaged and focused on high-value work by removing distractions.' },
        { title: 'Work Smarter', description: 'Record all inspections, track down the weaknesses of your beehives and limit them.' },
        { title: 'Simple Interface', description: 'With simple design and user interface our easy to use App allows you to become more effective.' },
      ],
      image: { src: 'assets/img/comb.webp', alt: 'Comb', width: 548, height: 542, priority: false },
      cta: { label: 'Discover how our beekeeping App works »', routerLink: '/app' },
    },
    infoColumns: {
      mode: 'light',
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
