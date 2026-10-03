import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../../environments/environment';
import {
  dailyByDate, daysBetween, formatLatency, formatRam, formatRate, formatRtf, shiftDay,
  VoiceDaily, VoiceQualityComponent,
} from './voice-quality';

describe('voice quality formatting', () => {
  it('shows rates as percentages with one decimal, a dash when there is none', () => {
    expect(formatRate(0.0423)).toBe('4.2%');
    expect(formatRate(0)).toBe('0.0%');
    expect(formatRate(1)).toBe('100.0%');
    expect(formatRate(null)).toBe('—');
  });

  it('shows latencies in seconds with one decimal', () => {
    expect(formatLatency(940)).toBe('0.9 s');
    expect(formatLatency(2150)).toBe('2.1 s');
    expect(formatLatency(null)).toBe('—');
  });

  it('formats RTF and RAM', () => {
    expect(formatRtf(0.456)).toBe('0.46');
    expect(formatRtf(null)).toBe('—');
    expect(formatRam(8192)).toBe('8.0 GB');
  });

  it('walks calendar days across a month end', () => {
    expect(shiftDay('2026-10-01', -1)).toBe('2026-09-30');
    expect(daysBetween('2026-09-29', '2026-10-02')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  });
});

describe('dailyByDate', () => {
  const row = (date: string, build: string, rounds: number, rate: number | null): VoiceDaily => ({
    date, build, rounds, not_understood_rate: rate, say_again_rate: rate, fallback_rate: null, latency_p50_ms: 900,
  });

  it('weights each build by its rounds and leaves empty days as gaps', () => {
    const days = dailyByDate(
      [row('2026-10-01', '1.0 (4)', 30, 0.1), row('2026-10-01', '1.1 (5)', 10, 0.5), row('2026-10-03', '1.1 (5)', 4, null)],
      '2026-10-01', '2026-10-03',
    );

    expect(days.map(d => d.rounds)).toEqual([40, 0, 4]);
    expect(days[0].not_understood_rate).toBeCloseTo(0.2);
    expect(days[0].fallback_rate).toBeNull();
    expect(days[1].not_understood_rate).toBeNull();
    expect(days[2].say_again_rate).toBeNull();
  });
});

describe('VoiceQualityComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for the last 30 days, and sends a filter only when one is chosen', () => {
    const component = TestBed.runInInjectionContext(() => new VoiceQualityComponent());
    component.load();

    const from = shiftDay(component.today, -29);
    http.expectOne(`${environment.apiUrl}admin/voice-quality?from=${from}&to=${component.today}`).flush({
      success: true,
      data: {
        summary: { rounds: 0, users: 0, devices: 0, phrases: 0, not_understood_rate: null, ignored_noise_rate: null,
          say_again_rate: null, hive_not_in_apiary_rate: null, fallback_rate: null, latency_p50_ms: null, latency_p90_ms: null },
        daily: [], devices: [], self_test_failures: [],
        fallback_reasons: { self_test_failed: 0, start_failed: 0, stopped_mid_round: 0 },
        builds: ['1.1 (5)'], device_models: ['Pixel 9'],
      },
    });
    expect(component.empty()).toBe(true);
    expect(component.ratesChart()).toBeNull();

    component.onBuildChange({ target: { value: '1.1 (5)' } } as unknown as Event);
    http.expectOne(`${environment.apiUrl}admin/voice-quality?from=${from}&to=${component.today}&build=1.1+%285%29`)
      .flush({ success: true, data: null });
  });

  it('keeps the range inside the 90 days the API keeps', () => {
    const component = TestBed.runInInjectionContext(() => new VoiceQualityComponent());
    component.onFromChange({ target: { value: '2000-01-01' } } as unknown as Event);
    http.expectOne(r => r.url.includes('admin/voice-quality')).flush({ success: true, data: null });

    expect(component.from()).toBe(shiftDay(component.today, -90));
  });
});
