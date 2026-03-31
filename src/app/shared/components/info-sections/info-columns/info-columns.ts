import { Component, input } from '@angular/core';

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
  items = [
    { title: '1.000+', description: 'Customers' },
    { title: '10.000+', description: 'Social followers' },
    { title: '3 years', description: 'Online' },
  ];
}
