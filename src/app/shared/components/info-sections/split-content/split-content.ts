import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { MediaSide, SplitContentStep } from './split-content.model';

/**
 * The explaining section: artwork one side, a heading and a paragraph the
 * other, no call to action. Two-up at 992 on its own grid. The description is
 * a `p` at the h4 size, never an h4. `steps` takes a short labelled sequence.
 * Alternate `mediaSide` by index across a repeated series.
 * Usage: `<section app-split-content mediaSide="end" …></section>`.
 */
@Component({
  selector: 'section[app-split-content]',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './split-content.html',
  host: { class: 'split-content' },
})
export class SplitContentComponent {
  title = input.required<string>();
  description = input.required<string>();
  image = input.required<ImageConfig>();
  steps = input<SplitContentStep[]>([]);
  mediaSide = input<MediaSide>('start');
}
