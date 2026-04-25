import { Component, computed, input, output } from '@angular/core';
import {
  CalendarDay, CalendarEvent,
  getMonthDays, resolveColor,
} from '../../calendar.model';

@Component({
  selector: 'app-cal-month',
  standalone: true,
  templateUrl: './month-view.html',
  styleUrl: './month-view.scss',
})
export class MonthViewComponent {
  readonly date   = input.required<Date>();
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();
  readonly dayClick   = output<Date>();

  protected readonly WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  protected readonly MAX_PILLS = 3;

  protected days = computed<CalendarDay[]>(() => getMonthDays(this.date(), this.events()));

  protected color(c?: string): string { return resolveColor(c); }
}
