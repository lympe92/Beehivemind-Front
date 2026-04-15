import { Component, input } from '@angular/core';

export type LoaderSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  size = input<LoaderSize>('md');
}
