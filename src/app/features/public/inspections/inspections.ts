import { Component } from '@angular/core';
import {
  HeroCenterContentComponent
} from '../../../shared/components/hero-sections/hero-center-content/hero-center-content';
import {SplitAccordionComponent} from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import {InfoColumnsComponent} from '../../../shared/components/info-sections/info-columns/info-columns';
import {FeaturesListCtaComponent} from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [
    HeroCenterContentComponent,
    SplitAccordionComponent,
    InfoColumnsComponent,
    FeaturesListCtaComponent,
    CtaBannerComponent
  ],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class InspectionsComponent {}
