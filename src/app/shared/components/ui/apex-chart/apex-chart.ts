import { Component, input, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartComponent, ApexOptions, ApexChart } from 'ngx-apexcharts';

@Component({
  selector: 'app-apex-chart',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './apex-chart.html',
})
export class ApexChartComponent {
  readonly options = input.required<ApexOptions>();
  readonly height = input<string | number>('100%');

  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly mergedOptions = computed<ApexOptions>(() => ({
    ...this.options(),
    chart: {
      ...this.options().chart,
      height: this.height(),
    } as ApexChart,
  }));
}