import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { StoreLink } from './application-download.model';

/**
 * The app-store band: heading, product mark, a line of subtitle, then the
 * store badges (vendor artwork in assets/icons — never restyled).
 * Usage: `<section app-application-download …></section>`.
 */
@Component({
  selector: 'section[app-application-download]',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './application-download.html',
  host: { class: 'app-download' },
})
export class ApplicationDownloadComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  logo = input.required<ImageConfig>();
  storeLinks = input.required<StoreLink[]>();
}
