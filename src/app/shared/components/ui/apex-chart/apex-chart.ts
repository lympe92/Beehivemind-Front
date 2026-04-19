import { Component, input, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartComponent, ApexOptions, ApexChart } from 'ngx-apexcharts';

@Component({
  selector: 'app-apex-chart',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './apex-chart.html',
  styleUrl: './apex-chart.scss',
})
export class ApexChartComponent {
  readonly options = input<ApexOptions | null>(null);
  readonly height = input<string | number>('100%');
  readonly loading = input(false);
  readonly emptyMessage = input('No data available.');

  private readonly platformId = inject(PLATFORM_ID);
  readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly skeletonHeight = computed(() => {
    const h = this.height();
    if (typeof h === 'number') return h + 'px';
    if (/^\d+$/.test(String(h))) return h + 'px';
    return String(h);
  });

  readonly mergedOptions = computed<ApexOptions | null>(() => {
    const opts = this.options();
    if (!opts) return null;
    return {
      ...opts,
      chart: {
        ...opts.chart,
        height: this.height(),
      } as ApexChart,
    };
  });
}
