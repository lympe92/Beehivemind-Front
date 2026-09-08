export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: Date | string;
  startTime?: string;   // "HH:mm"
  endTime?: string;     // "HH:mm"
  color?: string;       // named key or hex value
  meta?: unknown;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// ── Named color palette ──────────────────────────────────────────────────────
// A user-choice palette for calendar events, not brand colour — which is why it
// survives the one-accent rule. Seven, not eight: `orange` used to be declared
// twice (the brand value, then a Tailwind one that won), so the default colour
// of every unset event was off the palette. The brand value is the one kept.
// An eighth colour has to be a hue not already here, never a second orange.

export const CALENDAR_COLORS: Record<string, string> = {
  orange: '#f69520',
  blue:   '#3b82f6',
  green:  '#22c55e',
  red:    '#ef4444',
  purple: '#a855f7',
  teal:   '#14b8a6',
  gray:   '#6b7280',
};

export function resolveColor(color?: string): string {
  if (!color) return CALENDAR_COLORS['orange'];
  return CALENDAR_COLORS[color] ?? color;
}

/** An event chip is a tint of its hue with an ink label; the hue itself stays
 *  legible as an inset rule down the left edge. White on these hues measured
 *  2.27:1 to 3.96:1; ink on a 22% tint clears 4.5:1 for all seven. */
export function chipBackground(color?: string): string {
  return `color-mix(in srgb, ${resolveColor(color)} 22%, #fff)`;
}

export function chipBar(color?: string): string {
  return `inset 3px 0 0 ${resolveColor(color)}`;
}

// ── Pure date utilities ──────────────────────────────────────────────────────

export function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

export function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter(e => isSameDay(toDate(e.date), day))
    .sort((a, b) => (a.startTime ?? '00:00').localeCompare(b.startTime ?? '00:00'));
}

/** 42 cells (6 rows × 7 cols), Monday-based, for the month grid. */
export function getMonthDays(date: Date, events: CalendarEvent[]): CalendarDay[] {
  const year  = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const firstDay    = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // 0 = Mon
  const start       = new Date(firstDay);
  start.setDate(1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: new Date(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: isSameDay(d, today),
      events: eventsForDay(events, d),
    };
  });
}

/** 7 days of the week that contains `date`, Monday-first. */
export function getWeekDays(date: Date, events: CalendarEvent[]): CalendarDay[] {
  const today      = new Date();
  const offset     = (date.getDay() + 6) % 7;
  const monday     = new Date(date);
  monday.setDate(date.getDate() - offset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: new Date(d),
      isCurrentMonth: true,
      isToday: isSameDay(d, today),
      events: eventsForDay(events, d),
    };
  });
}

export function formatPeriodLabel(date: Date, view: CalendarView): string {
  if (view === 'month') {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  }
  if (view === 'week') {
    const offset = (date.getDay() + 6) % 7;
    const mon    = new Date(date); mon.setDate(date.getDate() - offset);
    const sun    = new Date(mon);  sun.setDate(mon.getDate() + 6);
    const s = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(mon);
    const e = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(sun);
    return `${s} – ${e}`;
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(date);
}

export function shortWeekday(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}
