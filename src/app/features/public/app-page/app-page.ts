import { Component, inject } from '@angular/core';
import { HeroLeftContentComponent } from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import { RibbonComponent } from '../../../shared/components/info-sections/ribbon/ribbon';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { ApplicationDownloadComponent } from '../../../shared/components/cta-sections/application-download/application-download';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import {
  ApplicationDownloadConfig,
  CtaBannerConfig,
  HeroConfig,
  InfoColumnsConfig,
  RibbonConfig,
  SplitAccordionConfig,
  SplitContentConfig,
  TextColumnsConfig,
} from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';

interface AppPageConfig {
  hero: HeroConfig;
  ribbon: RibbonConfig;
  splitContent: SplitContentConfig;
  textColumns: TextColumnsConfig;
  splitAccordion1: SplitAccordionConfig;
  applicationDownload: ApplicationDownloadConfig;
  splitAccordion2: SplitAccordionConfig;
  questions: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * Applies its own SEO rather than the route's `seoKey`, like `/pricing` and
 * `/help`: the FAQPage node is built from `questions`, the band the page shows.
 */
@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [
    HeroLeftContentComponent,
    RibbonComponent,
    SplitContentComponent,
    TextColumnsComponent,
    SplitAccordionComponent,
    ApplicationDownloadComponent,
    InfoColumnsComponent,
    CtaBannerComponent,
  ],
  templateUrl: './app-page.html',
})
export class AppPageComponent {
  private seoService = inject(SeoService);

  readonly page: AppPageConfig = {
    hero: {
      // Was the apiaries page's hero, copied verbatim — two indexed pages
      // competing for the same phrase. This one is about the app.
      title: 'The beekeeping app that records while you work',
      subtitle: 'Describe a hive out loud and the app writes the inspection down. It runs offline, so an apiary with no signal changes nothing.',
      image: { src: '/assets/img/jar2.webp', alt: 'Jar', width: 473, height: 473, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    ribbon: {
      mode: 'dark',
      quote: 'The most innovative beekeeping app ever made.',
    },
    splitContent: {
      title: 'The smarter way to organize your apiaries',
      description: 'Its time to set your apiaries. When you create an apiary, you can pin it on map. Furthermore its practical to name your new apiary for better organization.',
      image: { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
    },
    textColumns: [
      { title: 'Dashboard', description: 'How to manage your beehives growth from dashboard.' },
      { title: 'Inspections', description: "Check the ways to keep notes for what's happening to your beehives." },
      { title: 'Mobile Apps', description: 'Use the Beehivemind App and collect all inspection data you need.' },
    ],
    splitAccordion1: {
      title: 'Create and manage your beehives',
      image: { src: '/assets/img/flower2.webp', alt: 'Flower', width: 473, height: 473 },
      items: [
        {
          title: 'Create beehives to start inspect',
          body: 'Before you start collecting data from inspections, the last step is creating the beehives that you want to keep notes on. Select the apiary you want, insert beehives and give them a name and group.',
          linkHref: '/features',
          linkLabel: 'Explore the features we offer »',
        },
        {
          title: 'Group beehives according to your needs',
          body: 'You can use beehive groups for better organization. Group beehives according to some similar features, like bought queens or new beehives. Now its possible for you to check their growth as a group.',
          linkHref: '/help',
          linkLabel: 'Read the help page »',
        },
      ],
    },
    applicationDownload: {
      title: 'New era on beekeeping!',
      subtitle: 'Meet our beekeeping app now!',
      logo: { src: '/assets/img/logotr.webp', alt: 'Logo', width: 512, height: 512 },
      storeLinks: [
        { href: 'https://play.google.com/store/apps/details?id=org.beehivemind', img: { src: '/assets/icons/android.svg', alt: 'Get it on Google Play', width: 180, height: 48 } },
        { href: 'https://apps.apple.com/app/beehivemind', img: { src: '/assets/icons/apple-store.svg', alt: 'Download on the App Store', width: 180, height: 48 } },
      ],
    },
    splitAccordion2: {
      title: 'Inspect and track your hives with ease',
      image: { src: '/assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221 },
      items: [
        {
          title: 'Use voice commands',
          body: 'Record inspection data hands-free using our voice recognition system. Keep your focus on the bees, not the screen.',
          linkHref: '/features',
          linkLabel: 'Explore the features we offer »',
        },
        {
          title: 'Track hive history',
          body: 'All your inspection data is stored and visualized in graphs. Understand trends and make better decisions for your colonies.',
          linkHref: '/features',
          linkLabel: 'Explore the features we offer »',
        },
      ],
    },
    // Every answer is the help page's own account of how recording works
    // (offline recognition, the beep, the hive command, corrections on the
    // website). No store or platform question until the listings exist.
    questions: {
      title: 'Common questions',
      image: { src: '/assets/img/hive.webp', alt: 'Straw-roofed beehive', width: 417, height: 417 },
      items: [
        {
          title: 'Does the app work without signal?',
          body: 'Yes. Speech recognition runs on the phone, so recording needs no connection. Inspections upload by themselves the next time the phone is online, and nothing is lost while you are out of range.',
        },
        {
          title: 'What does the app understand?',
          body: 'Ten phrases, such as "beehive number one", "six frames honey" or "queen cells". Each one is confirmed with a short beep, so you know it was heard without looking at the screen.',
          linkHref: '/help',
          linkLabel: 'All ten phrases »',
        },
        {
          title: 'What if it hears the wrong hive number?',
          body: 'Say the right number and carry on. Everything after a hive command belongs to that hive, so the earlier readings stay where they were, and a finished inspection can be corrected on the website.',
        },
        {
          title: 'Do I have to use my voice?',
          body: 'No. Inspections, harvests and feedings can all be entered from forms on the website. The app is for the part of the job where your hands are full.',
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
      secondary: { label: 'From the blog: about the app »', routerLink: '/blog/category/the-app' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const seo = SEO_CONFIG['app'];
    const faq = faqPageSchema(seo.meta_title, '/app', seo.meta_description, this.page.questions.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }
}
