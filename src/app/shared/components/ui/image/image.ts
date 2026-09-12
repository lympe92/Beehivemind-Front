import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

/**
 * A `priority` image gets `fetchpriority="high"`, eager loading and — during
 * the server render — a `<link rel="preload">` in the head, all from
 * `NgOptimizedImage` itself, loader or not. This component used to add a second
 * preload link of its own, so every hero was announced twice.
 *
 * `alt=""` marks an image as decorative (the logo mark used as a list bullet).
 */
@Component({
  selector: 'app-image',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './image.html',
  styleUrl: './image.scss',
})
export class ImageComponent {
  src = input.required<string>();
  alt = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();
  priority = input<boolean>(false);
}
