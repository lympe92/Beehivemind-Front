import { Component, Input, inject, OnChanges, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WeatherService } from '../../../../core/services/weather.service';
import { WeatherData } from '../../../../core/models/weather.model';

const S = `style="width:100%;height:100%;display:block"`;

const ICONS: Record<string, string> = {
  'clear': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
  'mostly-clear': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3" fill="currentColor" stroke="none"/><path d="M9 3v1.5M3.2 3.2l1 1M3 9h1.5M3.2 14.8l1-1M14.8 3.2l-1 1" stroke-width="1.5"/><path d="M16 11.5a3.5 3.5 0 0 1 0 7H8a3.5 3.5 0 0 1 0-7h.2A4.5 4.5 0 0 1 16 11.5z" fill="rgba(255,255,255,0.35)" stroke="currentColor"/></svg>`,
  'partly-cloudy': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" opacity="0.85"/><path d="M8 2v1M2.5 2.5l.7.7M2 8h1M2.5 13.5l.7-.7M13.5 2.5l-.7.7" stroke-width="1.5" opacity="0.85"/><path d="M18 13a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8h.2A5 5 0 0 1 18 13z" fill="rgba(255,255,255,0.3)" stroke="currentColor"/></svg>`,
  'mostly-cloudy': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="8" r="2.5" fill="currentColor" stroke="none" opacity="0.5"/><path d="M7 3v1M2.8 3l.7.7M2 8h1" stroke-width="1.5" opacity="0.5"/><path d="M19 11a4.5 4.5 0 0 1 0 9H6a4.5 4.5 0 0 1 0-9h.2A6 6 0 0 1 19 11z" fill="rgba(255,255,255,0.28)" stroke="currentColor"/></svg>`,
  'overcast': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 10a5 5 0 0 1 0 10H5a5 5 0 0 1 0-10h.2A7 7 0 0 1 19 10z" fill="rgba(255,255,255,0.22)" stroke="currentColor"/></svg>`,
  'fog': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h18M3 12h18M5 16h14M7 20h10"/></svg>`,
  'drizzle': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h.2A6.5 6.5 0 0 1 17 9z" fill="rgba(255,255,255,0.22)"/><path d="M8 20l-1 2M12 20l-1 2M16 20l-1 2" stroke-width="1.5"/></svg>`,
  'rain': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h.2A6.5 6.5 0 0 1 17 9z" fill="rgba(255,255,255,0.22)"/><path d="M7 19v3M11 19v3M15 19v3M9 21v3M13 21v3"/></svg>`,
  'snow': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h.2A6.5 6.5 0 0 1 17 9z" fill="rgba(255,255,255,0.22)"/><path d="M8 20l.5 2-.5 2M12 20v4M16 20l-.5 2 .5 2M7 22h2M11 22h2M15 22h2" stroke-width="1.5"/></svg>`,
  'sleet': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 9a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h.2A6.5 6.5 0 0 1 17 9z" fill="rgba(255,255,255,0.22)"/><path d="M8 19v2M12 19l-.5 2M16 19v2M9 22l-.5 1M13 21l-.5 1" stroke-width="1.5"/></svg>`,
  'storm': `<svg ${S} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8a5 5 0 0 1 0 10H6a5 5 0 0 1 0-10h.2A6.5 6.5 0 0 1 17 8z" fill="rgba(255,255,255,0.22)"/><path d="M13 12l-3 5h5l-3 5" stroke-width="2.5"/></svg>`,
};

@Component({
  selector: 'app-weather-card',
  standalone: true,
  imports: [],
  templateUrl: './weather-card.html',
  styleUrl: './weather-card.scss',
})
export class WeatherCardComponent implements OnChanges {
  @Input() lat!: number;
  @Input() lng!: number;
  @Input() locationName?: string | null;

  private weatherService = inject(WeatherService);
  private sanitizer      = inject(DomSanitizer);

  weather    = signal<WeatherData | null>(null);
  loading    = signal(true);
  error      = signal(false);
  showHourly = signal(false);

  ngOnChanges(): void {
    if (!this.lat || !this.lng) return;
    this.loading.set(true);
    this.error.set(false);
    this.weatherService.getForecast(this.lat, this.lng).subscribe({
      next:  data => { this.weather.set(data); this.loading.set(false); },
      error: ()   => { this.error.set(true);   this.loading.set(false); },
    });
  }

  icon(code: number): SafeHtml {
    const type = this.weatherService.weatherIconType(code);
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[type] ?? ICONS['overcast']);
  }

  windDir(deg: number): string {
    return this.weatherService.windDirLabel(deg);
  }

  dayLabel(date: string): string {
    return this.weatherService.dayLabel(date);
  }

  toggleHourly(): void {
    this.showHourly.update(v => !v);
  }
}
