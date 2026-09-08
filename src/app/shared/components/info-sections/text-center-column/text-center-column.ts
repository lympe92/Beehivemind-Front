import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';

/**
 * A centred heading and one line of subtitle over centred artwork —
 * HeroCenterContent minus the calls to action, for mid-page use.
 * Usage: `<section app-text-center-column …></section>`.
 */
@Component({
  selector: 'section[app-text-center-column]',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './text-center-column.html',
  host: { class: 'container' },
})
export class TextCenterColumnComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
}
