import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './split-content.html',
  styleUrl: './split-content.scss',
})
export class SplitContentComponent {
  title = input.required<string>();
  description = input.required<string>();
  image = input.required<ImageConfig>();
}
