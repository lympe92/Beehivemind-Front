import { Component } from '@angular/core';
import {
    HeroCenterContentComponent
} from "../../../shared/components/hero-sections/hero-center-content/hero-center-content";
import {
  TextCenterColumnComponent
} from '../../../shared/components/info-sections/text-center-column/text-center-column';
import {FeaturesListCtaComponent} from '../../../shared/components/cta-sections/features-list-cta/features-list-cta';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import {InfoColumnsComponent} from '../../../shared/components/info-sections/info-columns/info-columns';

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [
    HeroCenterContentComponent,
    TextCenterColumnComponent,
    FeaturesListCtaComponent,
    CtaBannerComponent,
    InfoColumnsComponent
  ],
  templateUrl: './financial.html',
  styleUrl: './financial.scss',
})
export class FinancialComponent {}
