import { Component, input } from '@angular/core';
import { InfoColumnItem } from './info-columns.model';

export type InfoColumnsMode = 'default' | 'light';

/**
 * The proof band: three big figures with labels under them. `title` on an item
 * is the FIGURE, `description` its label. The figure is set at h3 scale and
 * weight 700 (a recorded figure); the label takes the structural voice.
 * Usage: `<section app-info-columns mode="light" …></section>`.
 */
@Component({
  selector: 'section[app-info-columns]',
  standalone: true,
  imports: [],
  templateUrl: './info-columns.html',
  host: {
    class: 'info-columns',
    '[class.info-columns--light]': "mode() === 'light'",
  },
})
export class InfoColumnsComponent {
  mode = input<InfoColumnsMode>('default');
  title = input.required<string>();
  items = input.required<InfoColumnItem[]>();
}
