import { Component, inject } from '@angular/core';
import { PageIntroComponent } from '../../../shared/components/info-sections/page-intro/page-intro';
import { TextColumnsComponent } from '../../../shared/components/info-sections/text-columns/text-columns';
import { SplitAccordionComponent } from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import { CtaBannerComponent } from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import { CtaBannerConfig, PageIntroConfig, SplitAccordionConfig, TextColumnsConfig } from '../public-page.model';
import { SeoService } from '../../../core/services/seo.service';
import { SEO_CONFIG } from '../../../core/services/seo.config';
import { faqPageSchema, fromAccordion, withFaq } from '../../../core/utils/faq-schema';
import { environment } from '../../../../environments/environment';

interface VoiceCommand {
  term: string;
  hint: string;
  desc: string;
}

interface HelpPageConfig {
  intro: PageIntroConfig;
  steps: TextColumnsConfig;
  commands: VoiceCommand[];
  troubleshooting: SplitAccordionConfig;
  ctaBanner: CtaBannerConfig;
}

/**
 * The voice command reference. The ten commands are real, taken from the
 * mobile client's parser (features/voice/parsing/command-parser.ts). It hands
 * off to the contact page at the end.
 *
 * The page applies its own SEO rather than going through the route's `seoKey`,
 * because the FAQPage node is built from `troubleshooting` — keeping the
 * questions in one place, where they cannot drift from what the page shows.
 * The route carries no `seoKey`, so `PublicLayoutComponent` leaves this alone.
 */
@Component({
  selector: 'app-help',
  standalone: true,
  imports: [PageIntroComponent, TextColumnsComponent, SplitAccordionComponent, CtaBannerComponent],
  templateUrl: './help.html',
})
export class HelpComponent {
  private seoService = inject(SeoService);

  readonly page: HelpPageConfig = {
    intro: {
      eyebrow: 'Help',
      title: 'How recording works',
      lead: 'Beehivemind listens while you work. Learn ten phrases and you never touch the screen during an inspection.',
    },
    steps: [
      { title: 'Open and start', description: 'Open the app at the apiary, press record, and put the phone in your pocket. Recognition runs offline, so a dead spot in the field costs you nothing.' },
      { title: 'Say what you see', description: 'Name the hive, then describe it. The app confirms each recognised phrase with a short beep so you know it landed without looking.' },
      { title: 'Stop and sync', description: 'Press stop when the row is done. The inspection uploads the next time the phone has signal, and appears on the website ready to review.' },
    ],
    commands: [
      { term: 'Beehive number one', hint: 'beehive <n>', desc: 'Selects the hive you are about to describe. Everything after this applies to it until you name another.' },
      { term: 'Seven frames space', hint: '<n> frames space', desc: 'How many frames the box holds. Say it once per hive.' },
      { term: 'Five frames population', hint: '<n> frames population', desc: 'How many of those frames are covered by bees.' },
      { term: 'Two frames pollen', hint: '<n> frames pollen', desc: 'Frames of stored pollen. Quantities are always relative to a whole frame.' },
      { term: 'Six frames honey', hint: '<n> frames honey', desc: 'Frames of capped and uncapped honey together.' },
      { term: 'Three frames open brood', hint: '<n> frames open brood', desc: 'Eggs and uncapped larvae.' },
      { term: 'Three frames closed brood', hint: '<n> frames closed brood', desc: "Capped brood. Recorded separately so you can predict the hive's next three weeks." },
      { term: 'Queen exists', hint: 'queen exists · no queen', desc: 'Whether you saw her. Say the year too — “queen twenty twenty four” — to record her age.' },
      { term: 'Queen cells', hint: 'queen cells', desc: 'Marks the hive as preparing to swarm or replace its queen.' },
      { term: 'Varroa', hint: 'varroa · nosema · american foulbrood · european foulbrood', desc: 'Names a detection. Say it only when you find it; silence means absent.' },
    ],
    troubleshooting: {
      title: 'When something goes wrong',
      image: { src: '/assets/img/bee2.webp', alt: 'Bee', width: 473, height: 473 },
      items: [
        {
          title: 'It did not hear me',
          body: 'The beep is the confirmation. If it does not come, the phrase was not recognised — say it again rather than carrying on, since the app records nothing it did not understand. Wind noise and a phone inside a zipped jacket are the two usual causes.',
        },
        {
          title: 'I named the wrong hive',
          body: 'Say the correct hive number and keep going. Everything after a hive command belongs to that hive, so the earlier readings stay where you put them. Corrections to a finished inspection are made on the website, in the inspections tab.',
        },
        {
          title: 'My inspection has not appeared',
          body: 'Recordings stay on the phone until it has signal, then upload on their own. Nothing is lost while you are out of range. If a session is still pending after the phone has been online, open the app once to let it finish.',
          linkHref: '/contact',
          linkLabel: 'Ask us »',
        },
      ],
    },
    // The former Freshdesk portal is gone (404), so support is the contact page.
    ctaBanner: {
      title: 'Still stuck?',
      description: 'Write to us. A person answers — one of the people who build the software.',
      cta: { label: 'Contact us', routerLink: '/contact', variant: 'outline' },
    },
  };

  constructor() {
    // In the constructor, not ngOnInit, so the tags are part of the prerender.
    // Built from the accordion, which renders every answer (closed rows are
    // only hidden), so every question and answer is on the page.
    const seo = SEO_CONFIG['help'];
    const faq = faqPageSchema(`Help | ${environment.appName}`, '/help', seo.meta_description, this.page.troubleshooting.items.map(fromAccordion));
    this.seoService.applySEO(withFaq(seo, faq));
  }
}
