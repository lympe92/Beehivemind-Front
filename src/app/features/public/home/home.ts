import { Component } from '@angular/core';
import { HeroLeftContentComponent } from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import { RibbonComponent } from '../../../shared/components/info-sections/ribbon/ribbon';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { FeaturesRowComponent } from '../../../shared/components/cta-sections/features-row/features-row';
import { SplitListComponent } from '../../../shared/components/cta-sections/split-list/split-list';
import { PricingTiersComponent } from '../../../shared/components/cta-sections/pricing-tiers/pricing-tiers';
import { ApplicationDownloadComponent } from '../../../shared/components/cta-sections/application-download/application-download';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import {
  ApplicationDownloadConfig,
  CtaBannerConfig,
  FeaturesRowConfig,
  HeroConfig,
  InfoColumnsConfig,
  PricingConfig,
  RibbonConfig,
  SplitAccordionConfig,
  SplitContentConfig,
  SplitListConfig,
} from '../public-page.model';

interface HomePageConfig {
  hero: HeroConfig;
  ribbon1: RibbonConfig;
  productShot: SplitContentConfig;
  splitAccordion: SplitAccordionConfig;
  featuresRow: FeaturesRowConfig;
  ribbon2: RibbonConfig;
  splitList: SplitListConfig;
  pricing: PricingConfig;
  applicationDownload: ApplicationDownloadConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The page is a config object and a wiring template. Adding a section means
 * adding a key here and one element in the template; it means writing no CSS.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroLeftContentComponent,
    RibbonComponent,
    SplitContentComponent,
    SplitAccordionComponent,
    FeaturesRowComponent,
    SplitListComponent,
    PricingTiersComponent,
    ApplicationDownloadComponent,
    InfoColumnsComponent,
    CtaBannerComponent,
  ],
  templateUrl: './home.html',
})
export class HomeComponent {
  readonly page: HomePageConfig = {
    hero: {
      title: 'Beekeeping software that records by voice',
      subtitle: 'Increase your business productivity with our beehive management software.',
      image: { src: '/assets/img/bee4.webp', alt: 'Bee', width: 512, height: 358, priority: true },
      // Was /auth/login: a visitor who has never heard of the product landed
      // on a sign-in form, while the same label in the closing banner went to
      // /auth/register.
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
      proof: ['Records with no signal', 'Hands stay in the hive', 'Android and iOS'],
    },
    ribbon1: {
      mode: 'dark',
      quote: 'This App made my Business easier and funnier. Easy to use, does what it says.',
      // TODO(content): a real name and apiary. An anonymous store review is
      // the weakest form of proof there is.
      author: 'Google Play review',
    },
    // The product, shown: a real screen recording of the inspection table,
    // first after the hero because nothing else on the page pictured the
    // software.
    productShot: {
      title: 'Everything you recorded, in one row',
      description:
        'Fourteen readings make up an inspection. They land in a single line you can scan, compare against last month, or correct without leaving the table.',
      steps: [
        { title: 'One row per visit', body: "Every reading across, dates down the side. A hive's whole season reads top to bottom." },
        { title: 'Fix a figure in place', body: 'Click the cell and type. No dialog, and no re-entering the rest of the row to change one number.' },
        { title: 'Nothing to transcribe', body: "What you said in the field is already here. The evening's paperwork is reading it, not typing it up." },
      ],
      // Not `priority`: the band sits below the first screen on every width,
      // and an eager 83 KB GIF competed with the hero image for bandwidth.
      image: {
        src: '/assets/img/inspections.webp',
        alt: 'The Beehivemind inspection table, with a row being edited in place',
        width: 477,
        height: 213,
      },
    },
    splitAccordion: {
      title: 'Turn inspections into knowledge',
      image: { src: '/assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221 },
      items: [
        {
          title: 'Know your bees right now',
          body: "Do you know your bees? Use our advanced tools to understand your beehives' growth, decrease bee colonies mortality rate and promote the genetic improvement of your bee stocks.",
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
      // TODO(content): the line had no attribution, so it read as our own
      // slogan in quotation marks. Confirm or replace.
      author: 'Beehivemind',
    },
    splitList: {
      title: "See all info about hives' growth with Beehivemind app",
      items: [
        { title: 'Stay Hands-On', description: 'By using our beekeeping App you remain engaged and focused on high-value work by removing distractions.' },
        { title: 'Work Smarter', description: 'Record all inspections, track down the weaknesses of your beehives and limit them.' },
        { title: 'Simple Interface', description: 'With simple design and user interface our easy to use App allows you to become more effective.' },
      ],
      image: { src: '/assets/img/comb.webp', alt: 'Comb', width: 548, height: 542 },
      cta: { label: 'Discover how our beekeeping App works »', routerLink: '/app' },
    },
    // TODO(content): every figure below needs confirming. The tier names are
    // real (the admin panel filters on them); the prices and limits are the
    // shape the band should have, not agreed numbers. This band is also a
    // second copy of /pricing — change a price and two files need it.
    pricing: {
      title: 'Plans',
      note: 'Start free and stay free if one apiary is all you keep. Every plan records by voice, works offline and exports your data.',
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
    applicationDownload: {
      title: 'The app is where the recording happens',
      subtitle: 'Free on both stores, and it works without signal.',
      logo: { src: '/assets/img/logo1.webp', alt: 'Beehivemind', width: 105, height: 105 },
      storeLinks: [
        {
          href: 'https://play.google.com/store/apps/details?id=org.beehivemind',
          img: { src: '/assets/icons/android.svg', alt: 'Get it on Google Play', width: 180, height: 48 },
        },
        {
          href: 'https://apps.apple.com/app/beehivemind',
          img: { src: '/assets/icons/apple-store.svg', alt: 'Download on the App Store', width: 180, height: 48 },
        },
      ],
    },
    // TODO(content): the two figures marked need real numbers from the
    // database — they are the shape the band should have, not confirmed values.
    infoColumns: {
      mode: 'light',
      title: 'Trusted partner',
      items: [
        { title: '1.000+', description: 'Beekeepers' },
        { title: '18.000+', description: 'Hives managed' },
        { title: '260.000+', description: 'Inspections recorded' },
      ],
    },
    ctaBanner: {
      title: 'What are you waiting for?',
      description: "That's right, what are you waiting for? The only thing left to do is to register and download BeehiveMind App today!",
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };
}
