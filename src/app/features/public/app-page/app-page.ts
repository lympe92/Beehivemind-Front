import { Component } from '@angular/core';
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

interface AppPageConfig {
  hero: HeroConfig;
  ribbon: RibbonConfig;
  splitContent: SplitContentConfig;
  textColumns: TextColumnsConfig;
  splitAccordion1: SplitAccordionConfig;
  applicationDownload: ApplicationDownloadConfig;
  splitAccordion2: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

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
}
