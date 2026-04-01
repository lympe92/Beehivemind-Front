import { Component, input } from '@angular/core';
import { InfoColumnItem } from './info-columns.model';

export type InfoColumnsMode = 'default' | 'light';

@Component({
  selector: 'app-info-columns',
  standalone: true,
  imports: [],
  templateUrl: './info-columns.html',
  styleUrl: './info-columns.scss',
})
export class InfoColumnsComponent {
  mode = input<InfoColumnsMode>('default');
  title = input.required<string>();
  items = input.required<InfoColumnItem[]>();
}
