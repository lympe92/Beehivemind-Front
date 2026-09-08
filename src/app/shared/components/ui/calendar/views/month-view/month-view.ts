import { Component, computed, input, output } from '@angular/core';
import {
  CalendarDay, CalendarEvent,
  chipBackground, chipBar, getMonthDays,
} from '../../calendar.model';

/** Month grid: 6 rows × 7 cols, Monday first, two events per cell then "+N more". */
@Component({
  selector: 'app-cal-month',
  standalone: true,
  templateUrl: './month-view.html',
})
export class MonthViewComponent {
  readonly date   = input.required<Date>();
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();
  readonly dayClick   = output<Date>();

  protected readonly WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  protected readonly MAX_PILLS = 2;

  protected days = computed<CalendarDay[]>(() => getMonthDays(this.date(), this.events()));

  protected chipBg(c?: string): string { return chipBackground(c); }
  protected chipBar(c?: string): string { return chipBar(c); }
}
