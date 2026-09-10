import { Component } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitListComponent } from '../../../shared/components/cta-sections/split-list/split-list';
import { RibbonComponent } from '../../../shared/components/info-sections/ribbon/ribbon';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, HeroConfig, RibbonConfig, SplitListConfig } from '../public-page.model';

interface FeaturesPageConfig {
  hero: HeroConfig;
  splitListsPre: SplitListConfig[];
  ribbon: RibbonConfig;
  splitListsPost: SplitListConfig[];
  ctaBanner: CtaBannerConfig;
}

/**
 * Holds two arrays of SplitList configs and maps each, so repeating a section
 * is appending to an array. The media side alternates by index and the offset
 * carries across the ribbon, so the two loops read as one sequence.
 */
@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitListComponent, RibbonComponent, CtaBannerComponent],
  templateUrl: './features-page.html',
})
export class FeaturesPageComponent {
  readonly page: FeaturesPageConfig = {
    hero: {
      title: 'Tired of inefficient Beekeeping Softwares?',
      subtitle: 'Join users who made beehive management easy with our beekeeping software.',
      image: { src: '/assets/img/bee2.webp', alt: 'Bee', width: 473, height: 473, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    splitListsPre: [
      {
        title: 'Tools for effective apiary management',
        image: { src: '/assets/img/hive.webp', alt: 'Hive', width: 417, height: 417 },
        items: [
          { title: 'Frame cells analysis', description: 'Find out exactly how much honey, pollen, brood etc there is in your hives.' },
          { title: 'Info about population', description: 'Get a pulse on how your beehives are growing and get the right decision.' },
          { title: "Focus on queen's condition", description: 'Understand how queen impacts on the whole beehive prosperity.' },
          { title: 'Diseases panorama', description: 'Check often for diseases and keep them away from your beehives.' },
        ],
        cta: { label: 'Learn how to use inspections »', routerLink: '/inspections' },
      },
      {
        title: 'Get holistic view of apiary',
        image: { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
        items: [
          { title: 'Add apiaries location', description: 'Create your apiaries, add beehives and set their exact location on the map.' },
          { title: 'Organize your beehives', description: 'Select an apiary, create beehives, add notes and give them a number as a name.' },
          { title: 'Groups according to your needs', description: 'Personalize your account and set groups to beehives with similar characteristics.' },
        ],
        cta: { label: 'How to create apiaries and beehives »', routerLink: '/apiariesandbeehives' },
      },
      {
        title: 'Inspect without inspection checklists',
        image: { src: '/assets/img/flower2.webp', alt: 'Flower', width: 473, height: 473 },
        items: [
          { title: 'Record all beehive inspection data', description: 'Collect all inspection data only with your voice during inspection without touching screens.' },
          { title: 'Continuous Speech Recognition', description: 'Meet the highly accurate speech recognition technology during the inspection.' },
          { title: 'Mark the queen', description: 'You know who is the main prosperity factor in a hive. Book all info about queen now.' },
          { title: 'Stay updated about diseases', description: "Using our app, you'll get a clear picture of your hives healthiness and growth." },
        ],
        cta: { label: 'Meet our beekeeping app »', routerLink: '/app' },
      },
    ],
    ribbon: {
      mode: 'dark',
      quote: 'Being productive is all about using the right tool!',
    },
    splitListsPost: [
      {
        title: 'Understand your financial habits',
        image: { src: '/assets/img/jar.webp', alt: 'Jar', width: 473, height: 473 },
        items: [
          { title: 'Balance income and expenses', description: 'Create cost categories to control all your income and expenses.' },
          { title: 'Make confident decisions', description: "Each month you'll be able to view a full financial review of your business." },
          { title: 'Get business insights', description: 'Observe cash flow, see what is selling most and adapt your business to change.' },
        ],
        cta: { label: 'Keep an eye on our financial mode »', routerLink: '/financial' },
      },
      {
        title: "Keep control of the feedings 'n' harvests",
        image: { src: '/assets/img/comb.webp', alt: 'Comb', width: 473, height: 473 },
        items: [
          { title: 'Keep records of feedings', description: 'Use feeding feature to learn how much food consumed from each beehive.' },
          { title: 'Collect harvest data via your voice', description: 'Use our app to collect harvest data that can help you filter the most productive beehives.' },
          { title: 'Insert harvest data by typing', description: 'You know who is the main prosperity factor in a hive. Book all info about queen now.' },
        ],
        cta: { label: 'Find out about harvest and feedings »', routerLink: '/harvestandfeeding' },
      },
    ],
    ctaBanner: {
      title: 'What are you waiting for?',
      description: "That's right, what are you waiting for? The only thing left to do is to register and download BeehiveMind App today!",
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
      secondary: { label: 'Read the blog »', routerLink: '/blog' },
    },
  };

  /** Alternates the media side, carrying the offset across the ribbon. */
  side(index: number, offset = 0): 'start' | 'end' {
    return (index + offset) % 2 === 0 ? 'end' : 'start';
  }
}
