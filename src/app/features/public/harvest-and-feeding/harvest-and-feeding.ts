import { Component, inject } from '@angular/core';
import { HeroCenterContentComponent } from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerConfig, HeroConfig, InfoColumnsConfig, SplitAccordionConfig, SplitContentConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';

interface HarvestAndFeedingPageConfig {
  hero: HeroConfig;
  splitContents: SplitContentConfig[];
  questions: SplitAccordionConfig;
  infoColumns: InfoColumnsConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * Applies its own SEO rather than the route's `seoKey`, like `/pricing` and
 * `/help`: the FAQPage node is built from `questions`, the band the page shows.
 */
@Component({
  selector: 'app-harvest-and-feeding',
  standalone: true,
  imports: [HeroCenterContentComponent, SplitContentComponent, SplitAccordionComponent, CtaBannerComponent, InfoColumnsComponent],
  templateUrl: './harvest-and-feeding.html',
})
export class HarvestAndFeedingComponent {
  private seoService = inject(SeoService);

  readonly page: HarvestAndFeedingPageConfig = {
    hero: {
      // Was about inspection spreadsheets, which is the /inspections page's
      // subject — the strongest signal on the page pointed at the wrong one.
      title: 'Every harvest and feeding, recorded as it happens',
      subtitle: "Never worry about your feeding and harvest data. Beehivemind's tables update in real time via voice.",
      image: { src: '/assets/img/jar.webp', alt: 'Jar', width: 417, height: 417, priority: true },
      primaryCta: { label: 'Get Started', routerLink: '/auth/register', variant: 'primary' },
      secondaryCta: { label: 'Need a consultation? »', routerLink: '/contact', variant: 'outline' },
    },
    splitContents: [
      {
        title: 'Create a feeding in seconds',
        // Used to end "At the same time an outgoing cost will be generated on
        // financial tab." Nothing does that — a cost is only ever created from
        // the financial tab (the API's Costs module) — so the promise is gone.
        description: 'Input feedings for all your beehives individually or massively. Select the apiary or beehive that you want to add a feeding, insert the feeding type and the quantity.',
        image: { src: '/assets/img/inspections.webp', alt: 'Inspections', width: 477, height: 213 },
      },
      {
        title: 'Record harvest data on the go using your voice',
        description: 'Easily note how much honey you harvested from each hive using our voice recognition beekeeping app. Just explore Beehivemind App and use voice commands to describe how much honey you harvest from each hive.',
        image: { src: '/assets/img/feeding.webp', alt: 'Feeding', width: 477, height: 213 },
      },
      {
        title: 'Add harvest data with input form',
        description: "If you don't want to use our app, you can insert all harvest data with the help of harvest tab. Just select the apiary or beehive, type the harvest type and the total quantity. Then a new harvest log will be created.",
        image: { src: '/assets/img/harvest.webp', alt: 'Harvest', width: 477, height: 213 },
      },
    ],
    // The harvest types, units and the apiary-wide feeding are what the forms
    // in features/user/{harvest,feeding} accept; the other two are the
    // questions people search, each ending in the article that answers them.
    questions: {
      title: 'Common questions',
      image: { src: '/assets/img/jar2.webp', alt: 'Honey jar with a dipper', width: 473, height: 473 },
      items: [
        {
          title: 'What can I record as a harvest?',
          body: 'Honey, pollen, royal jelly and propolis, in kilos, pounds, litres or gallons. Record it against a single hive to see which colonies produce, or against the whole apiary when the supers came off together.',
        },
        {
          title: 'Can one feeding cover the whole apiary?',
          body: 'Yes. Leave the hive empty and the feeding is recorded for the apiary; pick a hive when only some colonies were fed. Sugar syrup, fondant, pollen patties, fresh pollen and supplements are all listed, as a stimulation or a maintenance feed.',
        },
        {
          title: 'When is honey ready to harvest?',
          body: 'When most of the frame is capped, around eighty to ninety per cent, and nectar does not shake out of the open cells. Honey below roughly eighteen per cent water, which a refractometer confirms, keeps without fermenting.',
          linkHref: '/blog/when-to-harvest-honey',
          linkLabel: 'When to take the supers off »',
        },
        {
          title: 'Should I feed 1:1 or 2:1 sugar syrup?',
          body: 'Thin 1:1 syrup, equal weights of sugar and water, in spring to help a colony build; thick 2:1, two parts sugar to one of water, in autumn to fill the winter stores. Never feed while honey supers are on, or the syrup ends up in the harvest.',
          linkHref: '/blog/sugar-syrup-for-bees',
          linkLabel: 'Mixing and feeding syrup »',
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
      secondary: { label: 'From the blog: honey harvest »', routerLink: '/blog/category/harvest' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    const seo = SEO_CONFIG['harvestAndFeeding'];
    const faq = faqPageSchema(seo.meta_title, '/harvestandfeeding', seo.meta_description, this.page.questions.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }

  side(index: number): 'start' | 'end' {
    return index % 2 === 0 ? 'start' : 'end';
  }
}
