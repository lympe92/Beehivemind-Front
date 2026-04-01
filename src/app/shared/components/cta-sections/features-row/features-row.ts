import { Component, input } from '@angular/core';
import { LinkButtonComponent } from '../../ui/link-button/link-button';
import { CtaLink } from '../../ui/link-button/link-button.model';
import { FeatureRowItem } from './features-row.model';

@Component({
  selector: 'app-features-row',
  standalone: true,
  imports: [LinkButtonComponent],
  templateUrl: './features-row.html',
  styleUrl: './features-row.scss',
})
export class FeaturesRowComponent {
  items = input.required<FeatureRowItem[]>();
  cta = input.required<CtaLink>();
}
