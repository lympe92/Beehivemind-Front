import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';
import { SplitListItem } from './split-list.model';
import { MediaSide } from '../../info-sections/split-content/split-content.model';

/**
 * A plain list of benefits beside artwork, everything visible, one centred CTA
 * under the whole section (outline by default — a mid-page nudge). Two-up at
 * 992; alternate `mediaSide` by index across a repeated series.
 * Usage: `<section app-split-list mediaSide="start" …></section>`.
 */
@Component({
  selector: 'section[app-split-list]',
  standalone: true,
  imports: [LinkButtonComponent, ImageComponent],
  templateUrl: './split-list.html',
  host: { class: 'split-list' },
})
export class SplitListComponent {
  title = input.required<string>();
  image = input.required<ImageConfig>();
  items = input.required<SplitListItem[]>();
  cta = input.required<CtaLink>();
  mediaSide = input<MediaSide>('end');
}
