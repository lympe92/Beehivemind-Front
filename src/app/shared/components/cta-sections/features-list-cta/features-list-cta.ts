import { Component, input } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';
import { FeatureItem } from './features-list-cta.model';

@Component({
  selector: 'app-features-list-cta',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './features-list-cta.html',
  styleUrl: './features-list-cta.scss',
})
export class FeaturesListCtaComponent {
  title = input.required<string>();
  items = input.required<FeatureItem[]>();
  ctaHref = input.required<string>();
  ctaLabel = input.required<string>();
}
