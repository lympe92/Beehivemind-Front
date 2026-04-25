import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { CalendarComponent } from '../../../shared/components/ui/calendar/calendar';
import { CalendarEvent } from '../../../shared/components/ui/calendar/calendar.model';
import { InspectionsActions } from '../../../store/inspections/inspections.actions';
import { selectAllInspections } from '../../../store/inspections/inspections.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CalendarComponent],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPageComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);

  private inspections = this.store.selectSignal(selectAllInspections);
  private beehives    = this.store.selectSignal(selectAllBeehives);

  events = computed<CalendarEvent[]>(() => {
    const beehiveMap = new Map(this.beehives().map(b => [b.id, b]));

    return this.inspections().map(i => {
      const beehive = beehiveMap.get(i.beehiveId);
      return {
        id:    i.id,
        title: beehive ? `Beehive ${beehive.name}` : `Beehive #${i.beehiveId}`,
        date:  i.date,
        color: 'blue',
        meta:  { type: 'inspection', id: i.id },
      } satisfies CalendarEvent;
    });
  });

  ngOnInit(): void {
    this.store.dispatch(InspectionsActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  onEventClick(event: CalendarEvent): void {
    this.router.navigate(['/user/inspections'], { queryParams: { id: event.id } });
  }
}
