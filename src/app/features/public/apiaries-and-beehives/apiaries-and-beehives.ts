import { Component } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaBannerConfig, HeroConfig, InfoColumnsConfig, SplitContentConfig } from '../public-page.model';

interface ApiariesPageConfig {
  hero: HeroConfig;
  splitContents: SplitContentConfig[];
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/** All three SplitContents reuse the same flower artwork — a deliberate rhythm. */
const FLOWER: ImageConfig = { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 };

@Component({
  selector: 'app-apiaries-and-beehives',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitContentComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './apiaries-and-beehives.html',
})
export class ApiariesAndBeehivesComponent {
  readonly page: ApiariesPageConfig = {
    hero: {
      title: 'Organise your apiaries and beehives on one map',
      subtitle: 'By utilizing the latest innovations in digital mapping, we offer you the best mapping system to depict your apiaries.',
      image: { src: '/assets/img/jar2.webp', alt: 'Jar', width: 473, height: 473, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary', size: 'md' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline', size: 'md' },
    },
    splitContents: [
      {
        title: 'The smarter way to organize your apiaries',
        description: 'Its time to set your apiaries. When you create an apiary, you can pin it on map. Furthermore its practical to name your new apiary for better organization.',
        image: FLOWER,
      },
      {
        title: 'Create beehives to start inspect',
        description: 'Before you start collecting data from inspections, the last step is creating the beehives that you want to keep notes on. So select the apiary you want to insert beehives that you want to create and give them a name and group.',
        image: FLOWER,
      },
      {
        title: 'Group beehives according to your needs',
        description: 'You can use beehive groups for better organization. Group beehives according to some similar features, like bought queens or new beehives etc. Now its possible for you to check their growth as a group.',
        image: FLOWER,
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
      description: 'The only thing left to do is to register and download BeehiveMind App today!',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
    },
  };

  side(index: number): 'start' | 'end' {
    return index % 2 === 0 ? 'start' : 'end';
  }
}
