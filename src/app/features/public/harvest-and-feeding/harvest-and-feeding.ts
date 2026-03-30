import { Component } from '@angular/core';
import {
    HeroCenterContentComponent
} from "../../../shared/components/hero-sections/hero-center-content/hero-center-content";
import {SplitContentComponent} from '../../../shared/components/info-sections/split-content/split-content';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';
import {InfoColumnsComponent} from '../../../shared/components/info-sections/info-columns/info-columns';

@Component({
  selector: 'app-harvest-and-feeding',
  standalone: true,
  imports: [
    HeroCenterContentComponent,
    SplitContentComponent,
    CtaBannerComponent,
    InfoColumnsComponent
  ],
  templateUrl: './harvest-and-feeding.html',
  styleUrl: './harvest-and-feeding.scss',
})
export class HarvestAndFeedingComponent {}
