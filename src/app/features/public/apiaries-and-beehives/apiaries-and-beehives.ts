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

interface HeroData {
  title: string;
  subtitle: string;
  image: ImageConfig;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
}

interface SplitContentData {
  title: string;
  description: string;
  image: ImageConfig;
}

interface InfoColumnsData {
  title: string;
  items: InfoColumnItem[];
}

interface CtaBannerData {
  title: string;
  description: string;
  cta: CtaLink;
}

@Component({
  selector: 'app-apiaries-and-beehives',
  standalone: true,
  imports: [AsyncPipe, HeroCenterContentComponent, SplitContentComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './apiaries-and-beehives.html',
  styleUrl: './apiaries-and-beehives.scss',
})
export class ApiariesAndBeehivesComponent {
  readonly hero$ = of<HeroData>({
    title: 'Manage your beehives instantly',
    subtitle: 'By utilizing the latest innovations in digital mapping, we offer you the best mapping system to depict your apiaries.',
    image: { src: 'assets/img/jar2.webp', alt: 'Jar', width: 473, height: 473 },
    primaryCta: { label: 'Get Started', routerLink: '/auth/login', variant: 'primary', size: 'md' },
    secondaryCta: { label: 'Need a consultation? »', routerLink: '/pages/contact-us', variant: 'outline', size: 'md' },
  });

  readonly splitContents$ = of<SplitContentData[]>([
    {
      title: 'The smarter way to organize your apiaries',
      description: 'Its time to set your apiaries. When you create an apiary, you can pin it on map. Furthermore its practical to name your new apiary for better organization.',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
    },
    {
      title: 'Create beehives to start inspect',
      description: 'Before you start collecting data from inspections, the last step is creating the beehives that you want to keep notes on. So select the apiary you want to insert beehives that you want to create and give them a name and group.',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
    },
    {
      title: 'Group beehives according to your needs',
      description: 'You can use beehive groups for better organization. Group beehives according to some similar features, like bought queens or new beehives etc. Now its possible for you to check their growth as a group.',
      image: { src: 'assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 },
    },
  ]);

  readonly infoColumns$ = of<InfoColumnsData>({
    title: 'Trusted partner',
    items: [
      { title: '1.000+', description: 'Customers' },
      { title: '10.000+', description: 'Social followers' },
      { title: '3 years', description: 'Online' },
    ],
  });

  readonly ctaBanner$ = of<CtaBannerData>({
    title: 'What are you waiting for?',
    description: 'The only thing left to do is to register and download BeehiveMind App today!',
    cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
  });
}
