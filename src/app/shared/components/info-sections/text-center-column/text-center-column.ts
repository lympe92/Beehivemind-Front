import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { ImageConfig } from '../../ui/image/image.model';

@Component({
  selector: 'app-text-center-column',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './text-center-column.html',
  styleUrl: './text-center-column.scss',
})
export class TextCenterColumnComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
  image = input.required<ImageConfig>();
}
