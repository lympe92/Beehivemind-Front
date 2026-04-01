import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { AccordionItem } from './split-accordion.model';

@Component({
  selector: 'app-split-accordion',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './split-accordion.html',
  styleUrl: './split-accordion.scss',
})
export class SplitAccordionComponent {
  title = input.required<string>();
  image = input.required<ImageConfig>();
  items = input.required<AccordionItem[]>();
}
