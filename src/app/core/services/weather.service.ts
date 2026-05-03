import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WeatherData, WeatherCurrent, WeatherDay, WeatherHour } from '../models/weather.model';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  private readonly BASE = 'https://api.tomorrow.io/v4/weather/forecast';

  getForecast(lat: number, lng: number): Observable<WeatherData> {
    const fields = [
      'temperature', 'temperatureMin', 'temperatureMax',
      'humidity', 'windSpeed', 'windGust', 'windDirection', 'windSpeedMax',
      'precipitationProbability', 'precipitationIntensity', 'precipitationAccumulationAvg',
      'uvIndex', 'weatherCode',
      'cloudCover', 'pressureSurfaceLevel',
      'sunriseTime', 'sunsetTime',
    ].join(',');

    const url = `${this.BASE}?location=${lat},${lng}&fields=${fields}&timesteps=1h,1d&units=metric&apikey=${environment.weatherApiKey}`;

    return this.http.get<any>(url).pipe(map(res => this.parse(res)));
  }

  private parse(res: any): WeatherData {
    const hourlyRaw = res?.timelines?.hourly ?? [];
    const daily     = res?.timelines?.daily  ?? [];

    const now = hourlyRaw[0]?.values ?? {};
    const current: WeatherCurrent = {
      temperature:              Math.round(now.temperature ?? 0),
      humidity:                 Math.round(now.humidity ?? 0),
      windSpeed:                Math.round(now.windSpeed ?? 0),
      windGust:                 Math.round(now.windGust ?? 0),
      windDirection:            Math.round(now.windDirection ?? 0),
      precipitationProbability: Math.round(now.precipitationProbability ?? 0),
      uvIndex:                  Math.round(now.uvIndex ?? 0),
      cloudCover:               Math.round(now.cloudCover ?? 0),
      pressureSurfaceLevel:     Math.round(now.pressureSurfaceLevel ?? 0),
      weatherCode:              now.weatherCode ?? 1000,
    };

    const forecast: WeatherDay[] = daily.slice(0, 7).map((d: any) => ({
      date:                     d.time.slice(0, 10),
      tempMin:                  Math.round(d.values?.temperatureMin ?? 0),
      tempMax:                  Math.round(d.values?.temperatureMax ?? 0),
      precipitationProbability: Math.round(d.values?.precipitationProbability ?? 0),
      precipitationMm:          Math.round((d.values?.precipitationAccumulationAvg ?? 0) * 10) / 10,
      weatherCode:              d.values?.weatherCode ?? 1000,
      windSpeedMax:             Math.round(d.values?.windSpeedMax ?? 0),
      sunriseTime:              d.values?.sunriseTime ? this.utcToLocal(d.values.sunriseTime) : null,
      sunsetTime:               d.values?.sunsetTime  ? this.utcToLocal(d.values.sunsetTime)  : null,
    }));

    const todayStr = new Date().toISOString().slice(0, 10);
    const hourly: WeatherHour[] = hourlyRaw
      .filter((h: any) => h.time.slice(0, 10) === todayStr)
      .map((h: any) => ({
        time:                     this.utcToLocal(h.time),
        temperature:              Math.round(h.values?.temperature ?? 0),
        precipitationProbability: Math.round(h.values?.precipitationProbability ?? 0),
        precipitationMm:          Math.round((h.values?.precipitationIntensity ?? 0) * 10) / 10,
        windSpeed:                Math.round(h.values?.windSpeed ?? 0),
        humidity:                 Math.round(h.values?.humidity ?? 0),
        cloudCover:               Math.round(h.values?.cloudCover ?? 0),
        weatherCode:              h.values?.weatherCode ?? 1000,
      }));

    return { current, forecast, hourly };
  }

  private utcToLocal(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  weatherIconType(code: number): string {
    if (code === 1000) return 'clear';
    if (code === 1100) return 'mostly-clear';
    if (code === 1101) return 'partly-cloudy';
    if (code === 1102 || code === 1103) return 'mostly-cloudy';
    if (code === 1001) return 'overcast';
    if (code === 2000 || code === 2100) return 'fog';
    if (code === 4000 || code === 4200) return 'drizzle';
    if (code === 4001 || code === 4201) return 'rain';
    if (code === 5000 || code === 5001 || code === 5100 || code === 5101) return 'snow';
    if (code >= 6000 && code <= 6201) return 'sleet';
    if (code === 8000) return 'storm';
    return 'overcast';
  }

  windDirLabel(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  dayLabel(dateStr: string): string {
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const d = new Date(dateStr + 'T00:00:00');
    if (d.toDateString() === today.toDateString())    return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tmrw';
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
}
