import { Component, DOCUMENT, OnInit, PLATFORM_ID, inject, input } from '@angular/core';
import { NgOptimizedImage, isPlatformServer } from '@angular/common';

@Component({
  selector: 'app-image',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './image.html',
})
export class ImageComponent implements OnInit {
  private doc        = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);

  src = input.required<string>();
  alt = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();
  priority = input<boolean>(false);

  /**
   * `NgOptimizedImage` gives a priority image `fetchpriority="high"` and eager
   * loading, but it only emits a `<link rel="preload">` when an image loader is
   * configured — and this app has none. So the LCP image is still found by the
   * parser rather than announced in the head.
   *
   * Server-side only, on purpose. A preload hint is spent during the initial
   * document load; adding one on a client-side navigation does nothing except
   * leave stale links in the head to clean up.
   */
  ngOnInit(): void {
    if (!this.priority() || !isPlatformServer(this.platformId)) {
      return;
    }
    const href = this.src();
    if (this.doc.head.querySelector(`link[rel="preload"][href="${href}"]`)) {
      return;
    }
    const link = this.doc.createElement('link');
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('href', href);
    link.setAttribute('fetchpriority', 'high');
    this.doc.head.appendChild(link);
  }
}
