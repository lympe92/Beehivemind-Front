import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { AccordionItem } from './split-accordion.model';

/**
 * Heading and artwork on the left, an expanding list of claims on the right.
 * The first row opens on mount; clicking the open row closes it, so all rows
 * can be collapsed. Rows are hairline-separated, not boxed as cards.
 * Usage: `<section app-split-accordion …></section>`.
 *
 * Every answer is rendered, open or not, and a closed one is only `hidden`:
 * `/help` and the product pages quote these answers in their FAQPage markup,
 * and a crawler reads what the server sent, not what a click would reveal.
 * A closed row also drops the body class, whose `display: flex` would
 * otherwise beat the `hidden` attribute.
 */
@Component({
  selector: 'section[app-split-accordion]',
  standalone: true,
  imports: [ImageComponent, RouterLink],
  templateUrl: './split-accordion.html',
  host: { class: 'container section-divider' },
})
export class SplitAccordionComponent {
  title = input.required<string>();
  image = input.required<ImageConfig>();
  items = input.required<AccordionItem[]>();

  readonly open = signal(0);

  toggle(index: number): void {
    this.open.set(this.open() === index ? -1 : index);
  }

  isExternal(href: string): boolean {
    return /^https?:\/\//i.test(href);
  }
}
