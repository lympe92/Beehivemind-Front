import { Injectable } from '@angular/core';
import { ApexOptions } from 'apexcharts';
import { BarChartData, LineChartData, PieChartData, RadialBarData } from '../models/chart.model';

// BeehiveMind brand palette
const BHM_COLORS = ['#F5A623', '#4A90D9', '#7ED321', '#D0021B', '#9B59B6', '#1ABC9C'];

const BASE_CHART: Partial<ApexOptions> = {
  chart: {
    fontFamily: 'Montserrat, system-ui, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
    background: 'transparent',
  },
  colors: BHM_COLORS,
  grid: {
    borderColor: '#e8e8e8',
    strokeDashArray: 4,
  },
  tooltip: { theme: 'light' },
  legend: { position: 'bottom', fontFamily: 'Montserrat, system-ui, sans-serif' },
  dataLabels: { enabled: false },
};

@Injectable({ providedIn: 'root' })
export class ChartBuilderService {

  line(data: LineChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_CHART,
      chart: { ...BASE_CHART.chart, type: 'area' },
      series: data.series,
      xaxis: { categories: data.categories },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    }, overrides);
  }

  bar(data: BarChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_CHART,
      chart: { ...BASE_CHART.chart, type: 'bar' },
      series: data.series,
      xaxis: { categories: data.categories },
      plotOptions: {
        bar: {
          horizontal: data.horizontal ?? false,
          borderRadius: 4,
          columnWidth: '55%',
        },
      },
    }, overrides);
  }

  pie(data: PieChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_CHART,
      chart: { ...BASE_CHART.chart, type: 'donut' },
      series: data.values,
      labels: data.labels,
      plotOptions: {
        pie: { donut: { size: '65%' } },
      },
    }, overrides);
  }

  radialBar(data: RadialBarData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_CHART,
      chart: { ...BASE_CHART.chart, type: 'radialBar' },
      series: [data.value],
      labels: [data.label],
      plotOptions: {
        radialBar: {
          hollow: { size: '60%' },
          dataLabels: {
            name: { fontSize: '14px' },
            value: { fontSize: '20px', fontWeight: 700 },
          },
        },
      },
    }, overrides);
  }

  private merge(base: ApexOptions, overrides: Partial<ApexOptions>): ApexOptions {
    return { ...base, ...overrides, chart: { ...base.chart, ...overrides.chart } };
  }
}
