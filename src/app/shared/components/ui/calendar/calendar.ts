import { Component, computed, input, output, signal } from '@angular/core';
import { CalendarEvent, CalendarView, formatPeriodLabel } from './calendar.model';
import { MonthViewComponent } from './views/month-view/month-view';
import { WeekViewComponent } from './views/week-view/week-view';
import { DayViewComponent } from './views/day-view/day-view';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [MonthViewComponent, WeekViewComponent, DayViewComponent],
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class CalendarComponent {
  readonly events = input<CalendarEvent[]>([]);

  readonly eventClick = output<CalendarEvent>();
  readonly dateClick  = output<Date>();

  protected view = signal<CalendarView>('month');
  protected date = signal(new Date());

  protected periodLabel = computed(() => formatPeriodLabel(this.date(), this.view()));

  protected readonly views: { key: CalendarView; label: string }[] = [
    { key: 'month', label: 'Month' },
    { key: 'week',  label: 'Week'  },
    { key: 'day',   label: 'Day'   },
  ];

  setView(v: CalendarView): void {
    this.view.set(v);
  }

  navigate(dir: 1 | -1): void {
    const d = new Date(this.date());
    const v = this.view();
    if      (v === 'month') d.setMonth(d.getMonth() + dir);
    else if (v === 'week')  d.setDate(d.getDate() + dir * 7);
    else                    d.setDate(d.getDate() + dir);
    this.date.set(d);
  }

  goToToday(): void {
    this.date.set(new Date());
  }

  onDayClick(date: Date): void {
    this.date.set(date);
    this.view.set('day');
    this.dateClick.emit(date);
  }

  onEventClick(ev: CalendarEvent): void {
    this.eventClick.emit(ev);
  }
}
