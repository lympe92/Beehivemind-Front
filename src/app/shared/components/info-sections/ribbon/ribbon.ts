import { Component, input } from '@angular/core';

export type RibbonMode = 'default' | 'dark';

@Component({
  selector: 'app-ribbon',
  standalone: true,
  imports: [],
  templateUrl: './ribbon.html',
  styleUrl: './ribbon.scss',
})
export class RibbonComponent {
  mode = input<RibbonMode>('default');
  quote = input.required<string>();
  author = input<string>();
}
