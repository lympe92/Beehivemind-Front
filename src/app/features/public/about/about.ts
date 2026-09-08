import { Component } from '@angular/core';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { SplitContentComponent } from '../../../shared/components/info-sections/split-content/split-content';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { RibbonComponent } from '../../../shared/components/info-sections/ribbon/ribbon';
import { InfoColumnsComponent } from '../../../shared/components/info-sections/info-columns/info-columns';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import {
  CtaBannerConfig,
  InfoColumnsConfig,
  PageIntroConfig,
  RibbonConfig,
  SplitContentConfig,
  TextColumnsConfig,
} from '../public-page.model';

interface AboutPageConfig {
  intro: PageIntroConfig;
  story: SplitContentConfig;
  principles: TextColumnsConfig;
  quote: RibbonConfig;
  facts: InfoColumnsConfig;
  cta: CtaBannerConfig;
}

/**
 * ⚠ DUMMY CONTENT. This page is here for its structure. Every name, date,
 * figure and quote below is invented and marked TODO(content) — they are the
 * shape the page needs, not claims to publish. The structure answers the three
 * questions an about page is read for, in order: who made this, why should I
 * trust it, and who else is using it.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [PageIntroComponent, SplitContentComponent, TextColumnsComponent, RibbonComponent, InfoColumnsComponent, CtaBannerComponent],
  templateUrl: './about.html',
})
export class AboutComponent {
  readonly page: AboutPageConfig = {
    intro: {
      // TODO(content): the year.
      eyebrow: 'Beekeeping software since 2019',
      title: 'About Beehivemind',
      lead: 'We build record-keeping for working beekeepers. The reason it records by voice is that the people who asked for it had their hands in a hive at the time.',
    },
    // TODO(content): all of it — this is placeholder narrative.
    story: {
      title: 'It started as a notebook problem',
      description: 'TODO(content) — the real story goes here. The placeholder below is the shape: a specific problem, a specific person, and what changed. Two hundred words at most.',
      steps: [
        { title: 'The problem', body: 'Fourteen readings an inspection, a hundred hives, and a notebook that has to survive smoke, gloves and rain. Most of it was being written up in the evening from memory.' },
        { title: 'What we built first', body: 'Voice recording for a single inspection. It worked badly and beekeepers used it anyway, which told us the problem was worth the rest of the work.' },
        { title: 'Where it is now', body: 'Apiaries, inspections, harvest, feeding, treatments and costs, on a phone that works without signal and a dashboard that reads a season top to bottom.' },
      ],
      // TODO(content): a real photograph — the team, or the apiary this was built in.
      image: { src: 'assets/img/bee1.webp', alt: 'TODO(content): replace with a photograph of the team or the apiary', width: 417, height: 221, priority: true },
    },
    // Three principles, each one falsifiable. TODO(content): confirm these are
    // the three you want to be held to.
    principles: [
      { title: 'The records are yours', description: 'Exportable on every plan, including the free one. A downgrade makes an apiary read-only, never deleted. We do not sell data and we do not show your hives to anyone.' },
      { title: 'It works where the bees are', description: 'The app records without a connection and syncs when it finds one. An apiary with no signal is the normal case, not the edge case.' },
      { title: 'Free stays free', description: 'One apiary and ten hives, with no card and no expiry. A beekeeper starting out should not have to pay to find out whether this suits them.' },
    ],
    // TODO(content): a real customer, with a name and an apiary, who has agreed
    // to be quoted. Until then this is placeholder text and must not ship.
    quote: {
      mode: 'dark',
      quote: 'TODO(content) — a named beekeeper, two sentences, about something specific that changed in their work.',
      author: 'TODO(content): name, apiary, location',
    },
    // TODO(content): every figure. The facts band counts the company, not the product.
    facts: {
      mode: 'light',
      title: 'The company',
      items: [
        { title: '2019', description: 'Founded' },
        { title: 'Greece', description: 'Based in' },
        { title: '6', description: 'People' },
        { title: '24', description: 'Countries with active accounts' },
      ],
    },
    cta: {
      title: 'Start with one apiary',
      description: 'The free plan takes a minute and needs no card. If it suits how you work, the rest is there.',
      cta: { label: 'Create an account', routerLink: '/auth/register', variant: 'outline' },
    },
  };
}
