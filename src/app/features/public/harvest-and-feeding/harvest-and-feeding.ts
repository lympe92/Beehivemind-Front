import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { of } from 'rxjs';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaLink } from '../../../shared/components/ui/link-button/link-button.model';
import { InfoColumnItem } from '../../../shared/components/info-sections/info-columns/info-columns.model';

interface SplitContentData {
  title: string;
  description: string;
  image: ImageConfig;
}

interface HarvestAndFeedingPageData {
  hero: { title: string; subtitle: string; image: ImageConfig; primaryCta: CtaLink; secondaryCta: CtaLink };
  splitContents: SplitContentData[];
  infoColumns: { title: string; items: InfoColumnItem[] };
  ctaBanner: { title: string; description: string; cta: CtaLink };
}

@Component({
  selector: 'app-harvest-and-feeding',
  standalone: true,
  imports: [AsyncPipe, HeroCenterContentComponent, SplitContentComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './harvest-and-feeding.html',
  styleUrl: './harvest-and-feeding.scss',
})
export class HarvestAndFeedingComponent {
  readonly pageData$ = of<HarvestAndFeedingPageData>({
    hero: {
      title: 'Throw away the beekeeping inspection spreadsheets',
      subtitle: "Never worry about your feeding and harvest data. Beehivemind's tables update in real time via voice.",
      image: { src: 'assets/img/jar.webp', alt: 'Jar', width: 417, height: 417 },
      primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline' },
    },
    splitContents: [
      {
        title: 'Create a feeding in seconds',
        description: 'Input feedings for all your beehives individually or massively. Select the apiary or beehive that you want to add a feeding, insert the feeding type and the quantity. At the same time an outgoing cost will be generated on financial tab.',
        image: { src: 'assets/img/inspections.gif', alt: 'Inspections', width: 477, height: 213 },
      },
      {
        title: 'Record harvest data on the go using your voice',
        description: 'Easily note how much honey you harvested from each hive using our voice recognition beekeeping app. Just explore Beehivemind App and use voice commands to describe how much honey you harvest from each hive.',
        image: { src: 'assets/img/feeding.gif', alt: 'Feeding', width: 477, height: 213 },
      },
      {
        title: 'Add harvest data with input form',
        description: "If you don't want to use our app, you can insert all harvest data with the help of harvest tab. Just select the apiary or beehive, type the harvest type and the total quantity. Then a new harvest log will be created.",
        image: { src: 'assets/img/harvest.gif', alt: 'Harvest', width: 477, height: 213 },
      },
    ],
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
