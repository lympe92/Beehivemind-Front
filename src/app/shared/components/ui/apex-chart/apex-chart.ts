import { Component, input, PLATFORM_ID, inject, OnInit, OnChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgApexchartsModule } from 'ngx-apexcharts';
import { ApexOptions } from 'apexcharts';

@Component({
  selector: 'app-apex-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './apex-chart.html',
})
export class ApexChartComponent implements OnInit, OnChanges {
  readonly options = input.required<ApexOptions>();
  readonly height = input<string | number>('100%');

  private readonly platformId = inject(PLATFORM_ID);

  isBrowser = false;

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnChanges(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
}
