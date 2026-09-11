import { FAQPageSchema, SEOModel } from '../models/seo.model';
import { environment } from '../../../environments/environment';

/** One question a page shows, in the words it shows it. */
export interface FaqEntry {
  question: string;
  answer: string;
}

/** An accordion row (`AccordionItem`) read as a question and its answer. */
export function fromAccordion(item: { title: string; body: string }): FaqEntry {
  return { question: item.title, answer: item.body };
}

/**
 * The `FAQPage` node for a static page that renders its own questions: the
 * plans band on `/pricing`, the troubleshooting list on `/help`, and the
 * "Common questions" band on each product page. Built from the array the
 * template renders, so the markup cannot promise an answer the page does not
 * show — Google drops FAQ markup that is not on screen, and the answer engines
 * quote it.
 */
export function faqPageSchema(name: string, path: string, description: string, entries: FaqEntry[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name,
    url: `${environment.appUrl}${path}`,
    description,
    mainEntity: entries.map((entry) => ({
      '@type': 'Question' as const,
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: entry.answer },
    })),
  };
}

/** A page's SEO entry with the FAQPage node added to its schema. */
export function withFaq(seo: SEOModel, faq: FAQPageSchema): SEOModel {
  const schema = Array.isArray(seo.schema) ? seo.schema : [seo.schema];
  return { ...seo, schema: [...schema, faq] };
}
