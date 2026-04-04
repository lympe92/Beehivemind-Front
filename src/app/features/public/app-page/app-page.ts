import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of } from 'rxjs';
import { HeroLeftContentComponent } from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import { RibbonComponent, RibbonMode } from '../../../shared/components/info-sections/ribbon/ribbon';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { ApplicationDownloadComponent } from '../../../shared/components/cta-sections/application-download/application-download';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaLink } from '../../../shared/components/ui/link-button/link-button.model';
import { TextColumn } from '../../../shared/components/info-sections/text-columns/text-columns.model';
import { AccordionItem } from '../../../shared/components/cta-sections/split-accordion/split-accordion.model';
import { StoreLink } from '../../../shared/components/cta-sections/application-download/application-download.model';
import { InfoColumnItem } from '../../../shared/components/info-sections/info-columns/info-columns.model';

interface AppPageData {
  hero: { title: string; subtitle: string; image: ImageConfig; primaryCta: CtaLink; secondaryCta: CtaLink };
  ribbon: { mode: RibbonMode; quote: string };
  splitContent: { title: string; description: string; image: ImageConfig };
  textColumns: TextColumn[];
  splitAccordion1: { title: string; image: ImageConfig; items: AccordionItem[] };
  applicationDownload: { title: string; subtitle: string; logo: ImageConfig; storeLinks: StoreLink[] };
  splitAccordion2: { title: string; image: ImageConfig; items: AccordionItem[] };
  infoColumns: { title: string; items: InfoColumnItem[] };
  ctaBanner: { title: string; description: string; cta: CtaLink };
}

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [AsyncPipe, HeroLeftContentComponent, RibbonComponent, SplitContentComponent, TextColumnsComponent, SplitAccordionComponent, ApplicationDownloadComponent, InfoColumnsComponent, CtaBannerComponent],
  templateUrl: './app-page.html',
  styleUrl: './app-page.scss',
})
export class AppPageComponent {
  readonly pageData$ = of<AppPageData>({
    hero: {
      title: 'Manage your beehives instantly',
      subtitle: 'By utilizing the latest innovations in digital mapping, we offer you the best mapping system to depict your apiaries.',
      image: { src: 'assets/img/jar2.webp', alt: 'Jar', width: 473, height: 473 },
      primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline' },
    },
    ribbon: {
      mode: 'dark',
      quote: 'The most innovative beekeeping app ever made.',
    },
    splitContent: {
      title: 'The smarter way to organize your apiaries',
      description: 'Its time to set your apiaries. When you create an apiary, you can pin it on map. Furthermore its practical to name your new apiary for better organization.',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
    },
    textColumns: [
      { title: 'Dashboard', description: 'How to manage your beehives growth from dashboard.' },
      { title: 'Inspections', description: 'Check the ways to keep notes for what\'s happening to your beehives.' },
      { title: 'Mobile Apps', description: 'Use the Beehivemind App and collect all inspection data you need.' },
    ],
    splitAccordion1: {
      title: 'Create and manage your beehives',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
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
          linkHref: 'https://beehivemind.freshdesk.com/support/home',
          linkLabel: 'Explore the docs »',
        },
      ],
    },
    applicationDownload: {
      title: 'New era on beekeeping!',
      subtitle: 'Meet our beekeeping app now!',
      logo: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 512, height: 512 },
      storeLinks: [
        { href: 'https://play.google.com/store/apps/details?id=org.beehivemindR', img: { src: 'assets/img/android.svg', alt: 'Download on Google Play', width: 160, height: 48 } },
        { href: 'https://play.google.com/store/apps/details?id=org.beehivemindR', img: { src: 'assets/img/Apple.svg', alt: 'Download on App Store', width: 160, height: 48 } },
      ],
    },
    splitAccordion2: {
      title: 'Inspect and track your hives with ease',
      image: { src: 'assets/img/bee1.webp', alt: 'Bee', width: 417, height: 221, priority: true },
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
    },
  });
}
