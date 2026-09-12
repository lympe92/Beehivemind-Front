import { Component, inject } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { FeaturesListCtaComponent } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import {
  CtaBannerConfig,
  FeaturesListCtaConfig,
  HeroConfig,
  InfoColumnsConfig,
  SplitAccordionConfig,
} from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';

interface InspectionsPageConfig {
  hero: HeroConfig;
  splitAccordion1: SplitAccordionConfig;
  featuresListCta: FeaturesListCtaConfig;
  splitAccordion2: SplitAccordionConfig;
  ctaBanner1: CtaBannerConfig;
  questions: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner2: CtaBannerConfig;
}

const LOGO: ImageConfig = { src: '/assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 };

/**
 * The only page with two CtaBanners: a title-only one mid-page as a pivot,
 * then the full closing one.
 *
 * Applies its own SEO rather than the route's `seoKey`, like `/pricing` and
 * `/help`: the FAQPage node is built from `questions`, the band the page shows.
 */
@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitAccordionComponent, InfoColumnsComponent, FeaturesListCtaComponent, CtaBannerComponent],
  templateUrl: './inspections.html',
})
export class InspectionsComponent {
  private seoService = inject(SeoService);

  readonly page: InspectionsPageConfig = {
    hero: {
      title: 'Hive inspections, recorded by voice',
      subtitle: 'Beehivemind makes your data assimilable. Monitor bee habits, track their performance and understand their needs.',
      image: { src: '/assets/img/hive.webp', alt: 'Hive', width: 417, height: 417, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    splitAccordion1: {
      title: 'Use the magic of voice recognition',
      image: { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
      items: [
        {
          title: 'Easy apiary management',
          body: 'When you are ready to start your inspection, simply open the app and use your voice to record what you see during inspection. When the inspection will be completed, all data will be available on site.',
          linkHref: '/help',
          linkLabel: 'Read the help page »',
        },
        {
          title: 'Voice recognition commands',
          body: 'Our continuous offline speech recognition delivers the insights you added in real time. Use the right voice commands to describe what you inspect. When the inspection is over, all data will be available on site.',
          linkHref: '/app',
          linkLabel: 'Learn more about our beekeeping app »',
        },
        {
          title: 'No wasted time at inspection',
          body: 'Beehivemind beekeeping app eliminates the time you spend on your screen during inspection. Just start the recording and use the voice commands you learned. No clicks needed. In this way you focus on the pulse of bees.',
          linkHref: '/app',
          linkLabel: 'See how our beekeeping app works »',
        },
      ],
    },
    featuresListCta: {
      title: 'With our beekeeping software you have all the variables you need to work',
      items: [
        { img: LOGO, title: "Inspection's date", description: 'Note the right date that you inspected your apiaries and explore their growth in a long run. After some inspections a complete graph will be available for you.' },
        { img: LOGO, title: 'Closed brood & eggs', description: 'Use the variables closed brood and eggs separately and gain the advantage of being able to predict the development of the hive in the near future.' },
        { img: LOGO, title: 'Pollen & honey', description: 'Mention the amounts of pollen and honey you find during the inspections. In this way you will easily find the apiaries or hives which need help or those ready for harvest.' },
        { img: LOGO, title: 'Frames & Population', description: 'By using the variables frames and population right, you can be any time aware as to whether your hives need frame addition or removal.' },
        { img: LOGO, title: 'Diseases', description: 'Keep notes on the diseases you find in each hive and get rid of them immediately by using the genetic material you have at your disposal.' },
        { img: LOGO, title: 'Info about queen', description: 'Every time you see the queen give the right voice command and you will be able to know when was the last time that the hive was prosperous.' },
      ],
      ctaHref: '/help',
      ctaLabel: 'Read the help page',
    },
    splitAccordion2: {
      title: 'Keep records of all-that happens',
      image: { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
      items: [
        {
          title: 'Easy to use inspection tab',
          body: 'See a list of all inspections that are currently on your account. Here you can correct whatever you want or check beekeeping management data for each beehive. Then consult dashboard tab for more.',
        },
        {
          title: 'Crystal clear updates',
          body: 'Impatient about editing inspection data? Our app sends automatically the data when your phone is online. In case that you insert data manually, a new report will be created at the same time.',
        },
        {
          title: 'Inspect without App',
          body: 'Do you trust the conventional ways to work? There is no problem. Just go to inspections tab and add the beekeeping inspection sheet manually. Then check dashboard tab to see growth of your colonies over the time.',
        },
      ],
    },
    ctaBanner1: {
      title: 'Ready to explore the app?',
      cta: { label: 'Explore the App', routerLink: '/app', variant: 'outline' },
    },
    // What a recording holds is the help page's list of phrases; the offline
    // and upload answers are the help page's own words. The first question is
    // the one searched most, and ends in the checklist article.
    questions: {
      title: 'Common questions',
      image: { src: '/assets/img/bee2.webp', alt: 'Honeybee seen from above', width: 473, height: 473 },
      items: [
        {
          title: 'How often should a hive be inspected?',
          body: 'Every seven to ten days while the colony is building up and could swarm, every two to three weeks once the main flow is over, and not at all in cold weather, when opening the hive costs the bees more heat than the visit is worth. Following the same order every time makes each visit quicker and misses less.',
          linkHref: '/blog/hive-inspection-checklist',
          linkLabel: 'The fourteen readings, in order »',
        },
        {
          title: 'What does one inspection record?',
          body: 'Frames of bees and the space they have, open and capped brood, pollen, honey, whether you saw the queen or queen cells, and any disease you found, varroa, nosema and both foulbroods included. Each visit becomes one row per hive, so the next visit is compared with the last one rather than with memory.',
          linkHref: '/help',
          linkLabel: 'The phrases the app understands »',
        },
        {
          title: 'Do I need phone signal at the apiary?',
          body: 'No. Speech recognition runs on the phone, so an inspection is recorded with no signal at all. It uploads by itself the next time the phone is online and appears on the website ready to review.',
        },
        {
          title: 'Can I add an inspection without the app?',
          body: 'Yes. The inspections tab on the website takes the same readings from a form, which suits notes written at the hive and typed up later. Inspections from the app and from the form land in the same list and the same dashboard.',
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
    ctaBanner2: {
      title: 'What are you waiting for?',
      description: "That's right, what are you waiting for? The only thing left to do is to register and download BeehiveMind App today!",
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
      secondary: { label: 'From the blog: inspections »', routerLink: '/blog/category/inspections' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const seo = SEO_CONFIG['inspections'];
    const faq = faqPageSchema(seo.meta_title, '/inspections', seo.meta_description, this.page.questions.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }
}
