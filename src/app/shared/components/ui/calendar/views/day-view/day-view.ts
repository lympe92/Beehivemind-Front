import { Component, computed, input, output } from '@angular/core';
import { CalendarEvent, eventsForDay, resolveColor } from '../../calendar.model';

/** Day view: a plain agenda list with times in a fixed gutter. */
@Component({
  selector: 'app-cal-day',
  standalone: true,
  templateUrl: './day-view.html',
})
export class DayViewComponent {
  readonly date   = input.required<Date>();
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();

  protected dayEvents = computed<CalendarEvent[]>(() =>
    eventsForDay(this.events(), this.date())
  );

  protected color(c?: string): string { return resolveColor(c); }

  protected timeRange(ev: CalendarEvent): string {
    if (!ev.startTime) return '';
    return ev.endTime ? `${ev.startTime}–${ev.endTime}` : ev.startTime;
  }
}
