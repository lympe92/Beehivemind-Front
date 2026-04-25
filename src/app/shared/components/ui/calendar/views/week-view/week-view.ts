import { Component, computed, input, output } from '@angular/core';
import {
  CalendarDay, CalendarEvent,
  getWeekDays, resolveColor, shortWeekday,
} from '../../calendar.model';

@Component({
  selector: 'app-cal-week',
  standalone: true,
  templateUrl: './week-view.html',
  styleUrl: './week-view.scss',
})
export class WeekViewComponent {
  readonly date   = input.required<Date>();
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();
  readonly dayClick   = output<Date>();

  protected days = computed<CalendarDay[]>(() => getWeekDays(this.date(), this.events()));

  protected weekday(d: Date): string  { return shortWeekday(d); }
  protected color(c?: string): string { return resolveColor(c); }
}
