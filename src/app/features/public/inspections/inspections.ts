import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of } from 'rxjs';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { FeaturesListCtaComponent } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaLink } from '../../../shared/components/ui/link-button/link-button.model';
import { AccordionItem } from '../../../shared/components/cta-sections/split-accordion/split-accordion.model';
import { FeatureItem } from '../../../shared/components/cta-sections/features-list-cta/features-list-cta.model';
import { InfoColumnItem } from '../../../shared/components/info-sections/info-columns/info-columns.model';

interface SplitAccordionData {
  title: string;
  image: ImageConfig;
  items: AccordionItem[];
}

interface CtaBannerData {
  title: string;
  description: string;
  cta: CtaLink;
}

interface InspectionsPageData {
  hero: { title: string; subtitle: string; image: ImageConfig; primaryCta: CtaLink; secondaryCta: CtaLink };
  splitAccordion1: SplitAccordionData;
  featuresListCta: { title: string; items: FeatureItem[]; ctaHref: string; ctaLabel: string };
  splitAccordion2: SplitAccordionData;
  ctaBanner1: CtaBannerData;
  infoColumns: { title: string; items: InfoColumnItem[] };
  ctaBanner2: CtaBannerData;
}

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [AsyncPipe, HeroCenterContentComponent, SplitAccordionComponent, InfoColumnsComponent, FeaturesListCtaComponent, CtaBannerComponent],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class InspectionsComponent {
  readonly pageData$ = of<InspectionsPageData>({
    hero: {
      title: 'Turn your Inspections into Knowledge',
      subtitle: 'Beehivemind makes your data assimilable. Monitor bee habits, track their performance and understand their needs.',
      image: { src: 'assets/img/hive.webp', alt: 'Hive', width: 417, height: 417 },
      primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline' },
    },
    splitAccordion1: {
      title: 'Use the magic of voice recognition',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
      items: [
        {
          title: 'Easy apiary management',
          body: 'When you are ready to start your inspection, simply open the app and use your voice to record what you see during inspection. When the inspection will be completed, all data will be available on site.',
          linkHref: 'https://beehivemind.freshdesk.com/support/home',
          linkLabel: 'Check the docs »',
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
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: "Inspection's date", description: 'Note the right date that you inspected your apiaries and explore their growth in a long run. After some inspections a complete graph will be available for you.' },
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Closed brood & eggs', description: 'Use the variables closed brood and eggs separately and gain the advantage of being able to predict the development of the hive in the near future.' },
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Pollen & honey', description: 'Mention the amounts of pollen and honey you find during the inspections. In this way you will easily find the apiaries or hives which need help or those ready for harvest.' },
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Frames & Population', description: 'By using the variables frames and population right, you can be any time aware as to whether your hives need frame addition or removal.' },
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Diseases', description: 'Keep notes on the diseases you find in each hive and get rid of them immediately by using the genetic material you have at your disposal.' },
        { img: { src: 'assets/img/logotr.webp', alt: 'Logo', width: 105, height: 105 }, title: 'Info about queen', description: 'Every time you see the queen give the right voice command and you will be able to know when was the last time that the hive was prosperous.' },
      ],
      ctaHref: 'https://beehivemind.freshdesk.com/support/home',
      ctaLabel: 'Explore the docs',
    },
    splitAccordion2: {
      title: 'Keep records of all-that happens',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
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
      description: '',
      cta: { label: 'Explore the App', routerLink: '/app', variant: 'outline' },
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
    },
  });
}
