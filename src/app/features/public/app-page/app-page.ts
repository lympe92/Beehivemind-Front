import { Component } from '@angular/core';
import {HeroLeftContentComponent} from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import {RibbonComponent} from '../../../shared/components/info-sections/ribbon/ribbon';
import {SplitContentComponent} from '../../../shared/components/info-sections/split-content/split-content';
import {TextColumnsComponent} from '../../../shared/components/info-sections/text-columns/text-columns';
import {SplitAccordionComponent} from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import {
  ApplicationDownloadComponent
} from '../../../shared/components/cta-sections/application-download/application-download';
import {InfoColumnsComponent} from '../../../shared/components/info-sections/info-columns/info-columns';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';

@Component({
  selector: 'app-app-page',
  standalone: true,
  imports: [
    HeroLeftContentComponent,
    RibbonComponent,
    SplitContentComponent,
    TextColumnsComponent,
    SplitAccordionComponent,
    ApplicationDownloadComponent,
    InfoColumnsComponent,
    CtaBannerComponent
  ],
  templateUrl: './app-page.html',
  styleUrl: './app-page.scss',
})
export class AppPageComponent {}
