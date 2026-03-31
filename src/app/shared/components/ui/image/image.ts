import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-image',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './image.html',
})
export class ImageComponent {
  src = input.required<string>();
  alt = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();
  priority = input<boolean>(false);
}
