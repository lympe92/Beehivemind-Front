import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DecimalPipe, formatDate } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApexAxisChartSeries, ApexOptions } from 'ngx-apexcharts';
import { RequestService } from '../../../core/services/request.service';
import { ChartBuilderService } from '../../../core/services/chart-builder.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { ApexChartComponent } from '../../../shared/components/ui/apex-chart/apex-chart';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';

/** Rates are 0..1, null when nothing was there to count. */
type Rate = number | null;

interface VoiceSummary {
  rounds: number;
  users: number;
  devices: number;
  phrases: number;
  not_understood_rate: Rate;
  ignored_noise_rate: Rate;
  say_again_rate: Rate;
  hive_not_in_apiary_rate: Rate;
  fallback_rate: Rate;
  latency_p50_ms: number | null;
  latency_p90_ms: number | null;
}

/** One day of one app build. */
export interface VoiceDaily {
  date: string;
  build: string;
  rounds: number;
  not_understood_rate: Rate;
  say_again_rate: Rate;
  fallback_rate: Rate;
  latency_p50_ms: number | null;
}

interface VoiceDevice {
  device_model: string;
  devices: number;
  rounds: number;
  self_test_failed: number;
  self_test_rtf_avg: number | null;
  latency_p50_ms: number | null;
  not_understood_rate: Rate;
  say_again_rate: Rate;
  fallback_rate: Rate;
}

interface SelfTestFailure {
  device_model: string;
  manufacturer: string | null;
  soc: string | null;
  android: string | null;
  ram_mb: number | null;
  build: string | null;
  model_id: string | null;
  self_test_rtf: number | null;
  reported_at: string;
}

interface VoiceQuality {
  summary: VoiceSummary;
  daily: VoiceDaily[];
  devices: VoiceDevice[];
  self_test_failures: SelfTestFailure[];
  fallback_reasons: { self_test_failed: number; start_failed: number; stopped_mid_round: number };
  builds: string[];
  device_models: string[];
}

/** One day across every build in the response, rates weighted by that build's rounds. */
export interface DayPoint {
  date: string;
  rounds: number;
  not_understood_rate: Rate;
  say_again_rate: Rate;
  fallback_rate: Rate;
}

/** The API keeps raw counts 90 days; the range cannot reach further back. */
export const MAX_DAYS_BACK = 90;
const DEFAULT_DAYS = 30;

/** "4.2%", or "—" when there was nothing to count. */
export function formatRate(rate: Rate | undefined): string {
  return rate === null || rate === undefined ? '—' : `${(rate * 100).toFixed(1)}%`;
}

/** Milliseconds as seconds, one decimal — "0.9 s". */
export function formatLatency(ms: number | null | undefined): string {
  return ms === null || ms === undefined ? '—' : `${(ms / 1000).toFixed(1)} s`;
}

/** The recognizer's real-time factor: under 1 keeps up with speech. */
export function formatRtf(rtf: number | null | undefined): string {
  return rtf === null || rtf === undefined ? '—' : rtf.toFixed(2);
}

export function formatRam(mb: number | null | undefined): string {
  return mb === null || mb === undefined ? '—' : `${(mb / 1024).toFixed(1)} GB`;
}

/** A local calendar day as YYYY-MM-DD (not toISOString, which is UTC). */
export function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDay(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return isoDay(new Date(y, m - 1, d + days));
}

/** Every day from `from` to `to`, both included. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to && days.length <= MAX_DAYS_BACK + 1; day = shiftDay(day, 1)) days.push(day);
  return days;
}

/**
 * The daily rows are per day *and* build. The chart shows one line per metric:
 * each day's rate is the builds' rates weighted by their rounds (a build with
 * no reading that day does not count), and a day with no rounds is a gap.
 */
export function dailyByDate(daily: VoiceDaily[], from: string, to: string): DayPoint[] {
  const weighted = (rows: VoiceDaily[], key: 'not_understood_rate' | 'say_again_rate' | 'fallback_rate'): Rate => {
    let sum = 0;
    let weight = 0;
    for (const r of rows) {
      if (r[key] === null || r[key] === undefined || !r.rounds) continue;
      sum += (r[key] as number) * r.rounds;
      weight += r.rounds;
    }
    return weight ? sum / weight : null;
  };

  return daysBetween(from, to).map(date => {
    const rows = daily.filter(r => r.date === date);
    return {
      date,
      rounds: rows.reduce((n, r) => n + (r.rounds ?? 0), 0),
      not_understood_rate: weighted(rows, 'not_understood_rate'),
      say_again_rate: weighted(rows, 'say_again_rate'),
      fallback_rate: weighted(rows, 'fallback_rate'),
    };
  });
}

/** A rate as a percentage with one decimal for the chart; null stays a gap. */
function percent(rate: Rate): number | null {
  return rate === null ? null : Math.round(rate * 1000) / 10;
}

@Component({
  selector: 'app-voice-quality',
  standalone: true,
  imports: [DecimalPipe, DataTableComponent, CardComponent, ApexChartComponent, AppErrorComponent],
  templateUrl: './voice-quality.html',
})
export class VoiceQualityComponent implements OnInit, OnDestroy {
  private request = inject(RequestService);
  private charts = inject(ChartBuilderService);
  private sub?: Subscription;

  readonly today = isoDay(new Date());
  readonly earliest = shiftDay(this.today, -MAX_DAYS_BACK);

  from = signal(shiftDay(this.today, -(DEFAULT_DAYS - 1)));
  to = signal(this.today);
  build = signal('');
  deviceModel = signal('');

  data = signal<VoiceQuality | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly formatRate = formatRate;
  readonly formatLatency = formatLatency;
  readonly formatRtf = formatRtf;
  readonly formatRam = formatRam;

  /** The selects keep the current choice even when the new range no longer lists it. */
  builds = computed(() => withChoice(this.data()?.builds ?? [], this.build()));
  deviceModels = computed(() => withChoice(this.data()?.device_models ?? [], this.deviceModel()));

  empty = computed(() => (this.data()?.summary.rounds ?? 0) === 0);

  /** Rows for DataTable, which tracks by `id`. Order as the API sends them: worst first. */
  devices = computed(() => (this.data()?.devices ?? []).map((d, id) => ({ ...d, id })));
  failures = computed(() => (this.data()?.self_test_failures ?? []).map((f, id) => ({ ...f, id })));

  readonly deviceColumns: ColumnDef[] = [
    { key: 'device_model', label: 'Phone' },
    { key: 'devices', label: 'Devices' },
    { key: 'rounds', label: 'Rounds' },
    { key: 'self_test_failed', label: 'Self-test failed' },
    { key: 'self_test_rtf_avg', label: 'RTF' },
    { key: 'latency_p50_ms', label: 'Response (p50)' },
    { key: 'not_understood_rate', label: 'Not understood' },
    { key: 'say_again_rate', label: 'Say again' },
    { key: 'fallback_rate', label: 'Google fallback' },
  ];

  readonly failureColumns: ColumnDef[] = [
    { key: 'device_model', label: 'Phone' },
    { key: 'manufacturer', label: 'Maker' },
    { key: 'soc', label: 'Chip' },
    { key: 'android', label: 'Android' },
    { key: 'ram_mb', label: 'RAM' },
    { key: 'build', label: 'Build' },
    { key: 'model_id', label: 'Model' },
    { key: 'self_test_rtf', label: 'RTF' },
    { key: 'reported_at', label: 'Date' },
  ];

  private days = computed(() => dailyByDate(this.data()?.daily ?? [], this.from(), this.to()));
  private dayLabels = computed(() => this.days().map(d => formatDate(d.date, 'MMM d', 'en-US')));

  ratesChart = computed<ApexOptions | null>(() => {
    const days = this.days();
    if (!days.some(d => d.rounds)) return null;
    const series: ApexAxisChartSeries = [
      { name: 'Not understood', data: days.map(d => percent(d.not_understood_rate)) },
      { name: 'Say the beehive again', data: days.map(d => percent(d.say_again_rate)) },
      { name: 'Fell back to Google', data: days.map(d => percent(d.fallback_rate)) },
    ];
    return this.charts.line({ series: [], categories: this.dayLabels() }, {
      series,
      chart: { type: 'line' },
      fill: { type: 'solid' },
      xaxis: { categories: this.dayLabels(), tickAmount: 10, labels: { rotate: 0, hideOverlappingLabels: true } },
      yaxis: { min: 0, labels: { formatter: (v: number) => `${Math.round(v)}%` } },
      tooltip: { theme: 'light', y: { formatter: (v: number | null) => (v === null || v === undefined ? '—' : `${v.toFixed(1)}%`) } },
    });
  });

  roundsChart = computed<ApexOptions | null>(() => {
    const days = this.days();
    if (!days.some(d => d.rounds)) return null;
    return this.charts.bar(
      { series: [{ name: 'Rounds', data: days.map(d => d.rounds) }], categories: this.dayLabels() },
      { xaxis: { categories: this.dayLabels(), tickAmount: 10, labels: { rotate: 0, hideOverlappingLabels: true } } },
    );
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const params = new URLSearchParams({ from: this.from(), to: this.to() });
    if (this.build()) params.set('build', this.build());
    if (this.deviceModel()) params.set('device_model', this.deviceModel());

    this.sub?.unsubscribe();
    this.sub = this.request.getRequest<VoiceQuality>(`admin/voice-quality?${params}`).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The voice quality figures did not load.');
        this.loading.set(false);
      },
    });
  }

  /** Clamped to the 90 days the API keeps, and never past the other end. */
  onFromChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    const from = value < this.earliest ? this.earliest : value > this.today ? this.today : value;
    this.from.set(from);
    if (from > this.to()) this.to.set(from);
    this.load();
  }

  onToChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    const to = value > this.today ? this.today : value < this.earliest ? this.earliest : value;
    this.to.set(to);
    if (to < this.from()) this.from.set(to);
    this.load();
  }

  onBuildChange(event: Event): void {
    this.build.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  onDeviceModelChange(event: Event): void {
    this.deviceModel.set((event.target as HTMLSelectElement).value);
    this.load();
  }
}

function withChoice(options: string[], choice: string): string[] {
  return choice && !options.includes(choice) ? [choice, ...options] : options;
}
