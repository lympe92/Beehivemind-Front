import { Injectable } from '@angular/core';
import { ApexOptions, ApexChart } from 'ngx-apexcharts';
import { BarChartData, LineChartData, PieChartData, RadialBarData } from '../models/chart.model';

// A data palette, not a brand palette. With one accent there is no honest
// categorical scale to build, so series run down the neutral ramp and the
// orange marks the series being asked about. These are the six steps in
// styles/tokens/charts.css (ApexCharts needs literal values, not custom
// properties, because it paints into SVG attributes).
const CHART_COLORS = ['#f69520', '#212121', '#757575', '#424242', '#e0e0e0', '#f5f5f5'];
const CHART_FONT = 'Peridot PE, system-ui, sans-serif';

const BASE_CHART_CONFIG: Omit<ApexChart, 'type'> = {
  fontFamily: CHART_FONT,
  // Apex defaults every axis label and legend entry to #373d3f, its own grey.
  foreColor: '#424242',
  toolbar: { show: false },
  zoom: { enabled: false },
  background: 'transparent',
};

const BASE_OPTIONS = {
  colors: CHART_COLORS,
  grid: { borderColor: '#e0e0e0', strokeDashArray: 4 },
  tooltip: { theme: 'light' as const },
  legend: { position: 'bottom' as const, fontFamily: CHART_FONT },
  dataLabels: { enabled: false },
};

@Injectable({ providedIn: 'root' })
export class ChartBuilderService {

  /** Smooth area chart with a fading gradient — the dashboard's time series. */
  line(data: LineChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_OPTIONS,
      chart: { ...BASE_CHART_CONFIG, type: 'area' },
      series: data.series,
      xaxis: { categories: data.categories },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
    }, overrides);
  }

  /** Rounded columns at 55% width. */
  bar(data: BarChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_OPTIONS,
      chart: { ...BASE_CHART_CONFIG, type: 'bar' },
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

  /** A donut, never a full pie — the hole is 65%. */
  pie(data: PieChartData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_OPTIONS,
      chart: { ...BASE_CHART_CONFIG, type: 'donut' },
      series: data.values,
      labels: data.labels,
      plotOptions: {
        pie: { donut: { size: '65%' } },
      },
    }, overrides);
  }

  radialBar(data: RadialBarData, overrides: Partial<ApexOptions> = {}): ApexOptions {
    return this.merge({
      ...BASE_OPTIONS,
      chart: { ...BASE_CHART_CONFIG, type: 'radialBar' },
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
    return {
      ...base,
      ...overrides,
      chart: { ...base.chart, ...overrides.chart } as ApexChart,
    };
  }
}
