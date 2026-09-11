import { Component, inject } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { ImageConfig } from '../../../shared/components/ui/image/image.model';
import { CtaBannerConfig, HeroConfig, InfoColumnsConfig, SplitAccordionConfig, SplitContentConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';

interface ApiariesPageConfig {
  hero: HeroConfig;
  splitContents: SplitContentConfig[];
  questions: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/** All three SplitContents reuse the same flower artwork — a deliberate rhythm. */
const FLOWER: ImageConfig = { src: '/assets/img/flower.webp', alt: 'Flower', width: 473, height: 473 };

/**
 * Applies its own SEO rather than the route's `seoKey`, like `/pricing` and
 * `/help`: the FAQPage node is built from `questions`, the band the page shows.
 */
@Component({
  selector: 'app-apiaries-and-beehives',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitContentComponent, SplitAccordionComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './apiaries-and-beehives.html',
})
export class ApiariesAndBeehivesComponent {
  private seoService = inject(SeoService);

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
    // Two about the product, two about the question a beekeeper actually
    // types, each ending in the article that answers it at length.
    questions: {
      title: 'Common questions',
      image: { src: '/assets/img/flower2.webp', alt: 'Clover in flower', width: 473, height: 473 },
      items: [
        {
          title: 'How do I add an apiary?',
          body: 'Give it a name, the number of hives it holds and its place on the map; the location name and the date it was set up are optional. The pin is what puts all your sites on one map, and every hive you create afterwards belongs to the apiary it stands in.',
        },
        {
          title: 'Where is the best place to put a beehive?',
          body: 'Somewhere dry and sheltered from the prevailing wind, with morning sun, water within a few hundred metres and forage within about three kilometres. Face the entrance away from paths and neighbours; a hedge or fence a couple of metres in front sends the bees up and over people.',
          linkHref: '/blog/where-to-put-a-beehive',
          linkLabel: 'Choosing an apiary site »',
        },
        {
          title: 'Can I move a hive a few metres?',
          body: 'Not in one go. Foragers fly back to the exact spot they know, so a hive moved a few metres loses its field bees. Move it less than a metre a day, or take it more than three miles, about five kilometres, away for three weeks before bringing it to the new spot.',
          linkHref: '/blog/how-to-move-a-beehive',
          linkLabel: 'The three feet or three miles rule »',
        },
        {
          title: 'How many hives can one apiary hold?',
          body: 'As many as the forage around it can feed. A handful is typical for a garden or hobby site, and twenty to forty works for an out-apiary on a large flow. When colonies on one site keep producing less than the same bees elsewhere, that site is full.',
          linkHref: '/blog/comparing-apiary-sites',
          linkLabel: 'Comparing two sites from their records »',
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
      description: 'The only thing left to do is to register and download BeehiveMind App today!',
      cta: { label: 'Get Started', routerLink: '/auth/register', variant: 'outline' },
      secondary: { label: 'From the blog: apiary sites »', routerLink: '/blog/category/apiaries' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const seo = SEO_CONFIG['apiariesAndBeehives'];
    const faq = faqPageSchema(seo.meta_title, '/apiariesandbeehives', seo.meta_description, this.page.questions.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }

  side(index: number): 'start' | 'end' {
    return index % 2 === 0 ? 'start' : 'end';
  }
}
