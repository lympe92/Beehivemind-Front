import { Component, input } from '@angular/core';

export type LoaderSize = 'sm' | 'md' | 'lg';

/** A centred spinner. Styles: `.loader` in styles/components/app/app.css. */
@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.html',
})
export class LoaderComponent {
  size = input<LoaderSize>('md');
}
