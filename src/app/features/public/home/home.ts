import { Component } from '@angular/core';
import { HeroLeftContentComponent } from '../../../shared/components/hero-sections/hero-left-content/hero-left-content';
import {RibbonComponent} from '../../../shared/components/info-sections/ribbon/ribbon';
import {SplitAccordionComponent} from '../../../shared/components/cta-sections/split-accordion/split-accordion';
import {FeaturesRowComponent} from '../../../shared/components/cta-sections/features-row/features-row';
import {SplitListComponent} from '../../../shared/components/cta-sections/split-list/split-list';
import {InfoColumnsComponent} from '../../../shared/components/info-sections/info-columns/info-columns';
import {CtaBannerComponent} from '../../../shared/components/cta-sections/cta-banner/cta-banner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroLeftContentComponent, RibbonComponent, SplitAccordionComponent, FeaturesRowComponent, SplitListComponent, InfoColumnsComponent, CtaBannerComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {}
