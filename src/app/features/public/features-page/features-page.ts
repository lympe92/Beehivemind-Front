import { Component } from '@angular/core';
import {
  HeroCenterContentComponent
} from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import {SplitListComponent} from '../../../shared/components/cta-sections/split-list/split-list';
import {RibbonComponent} from '../../../shared/components/info-sections/ribbon/ribbon';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';

@Component({
  selector: 'app-features-page',
  standalone: true,
  imports: [
    HeroCenterContentComponent,
    SplitListComponent,
    RibbonComponent,
    CtaBannerComponent
  ],
  templateUrl: './features-page.html',
  styleUrl: './features-page.scss',
})
export class FeaturesPageComponent {}
