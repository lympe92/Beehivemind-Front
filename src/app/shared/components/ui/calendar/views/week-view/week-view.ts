import { Component, computed, input, output } from '@angular/core';
import {
  CalendarDay, CalendarEvent,
  chipBackground, chipBar, getWeekDays, shortWeekday,
} from '../../calendar.model';

/** Week view: seven columns of a day list, not an hour grid. Scrolls sideways below 768. */
@Component({
  selector: 'app-cal-week',
  standalone: true,
  templateUrl: './week-view.html',
})
export class WeekViewComponent {
  readonly date   = input.required<Date>();
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();
  readonly dayClick   = output<Date>();

  protected days = computed<CalendarDay[]>(() => getWeekDays(this.date(), this.events()));

  protected weekday(d: Date): string  { return shortWeekday(d); }
  protected chipBg(c?: string): string { return chipBackground(c); }
  protected chipBar(c?: string): string { return chipBar(c); }
}
