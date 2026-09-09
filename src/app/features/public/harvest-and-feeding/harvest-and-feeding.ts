import { Component } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerConfig, HeroConfig, InfoColumnsConfig, SplitContentConfig } from '../public-page.model';

interface HarvestAndFeedingPageConfig {
  hero: HeroConfig;
  splitContents: SplitContentConfig[];
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

@Component({
  selector: 'app-harvest-and-feeding',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitContentComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './harvest-and-feeding.html',
})
export class HarvestAndFeedingComponent {
  readonly page: HarvestAndFeedingPageConfig = {
    hero: {
      // Was about inspection spreadsheets, which is the /inspections page's
      // subject — the strongest signal on the page pointed at the wrong one.
      title: 'Every harvest and feeding, recorded as it happens',
      subtitle: "Never worry about your feeding and harvest data. Beehivemind's tables update in real time via voice.",
      image: { src: 'assets/img/jar.webp', alt: 'Jar', width: 417, height: 417, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    splitContents: [
      {
        title: 'Create a feeding in seconds',
        description: 'Input feedings for all your beehives individually or massively. Select the apiary or beehive that you want to add a feeding, insert the feeding type and the quantity. At the same time an outgoing cost will be generated on financial tab.',
        image: { src: 'assets/img/inspections.webp', alt: 'Inspections', width: 477, height: 213 },
      },
      {
        title: 'Record harvest data on the go using your voice',
        description: 'Easily note how much honey you harvested from each hive using our voice recognition beekeeping app. Just explore Beehivemind App and use voice commands to describe how much honey you harvest from each hive.',
        image: { src: 'assets/img/feeding.webp', alt: 'Feeding', width: 477, height: 213 },
      },
      {
        title: 'Add harvest data with input form',
        description: "If you don't want to use our app, you can insert all harvest data with the help of harvest tab. Just select the apiary or beehive, type the harvest type and the total quantity. Then a new harvest log will be created.",
        image: { src: 'assets/img/harvest.webp', alt: 'Harvest', width: 477, height: 213 },
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
  };

  side(index: number): 'start' | 'end' {
    return index % 2 === 0 ? 'start' : 'end';
  }
}
