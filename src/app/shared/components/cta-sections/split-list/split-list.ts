import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';
import { CtaLink } from '../../ui/link-button/link-button.model';
import { SplitListItem } from './split-list.model';

@Component({
  selector: 'app-split-list',
  standalone: true,
  imports: [LinkButtonComponent, ImageComponent],
  templateUrl: './split-list.html',
  styleUrl: './split-list.scss',
})
export class SplitListComponent {
  title = input.required<string>();
  image = input.required<ImageConfig>();
  items = input.required<SplitListItem[]>();
  cta = input.required<CtaLink>();
}
