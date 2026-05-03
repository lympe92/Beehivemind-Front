import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { ApiaryService } from '../../../../core/services/apiary.service';
import { AgendaService } from '../../../../core/services/agenda.service';
import { InspectionService } from '../../../../core/services/inspection.service';
import { Apiary } from '../../../../core/models/apiary.model';
import { Inspection } from '../../../../core/models/inspection.model';
import { AgendaItem } from '../../../../core/models/agenda-item.model';
import { WeatherCardComponent } from '../../../../shared/components/ui/weather-card/weather-card';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { selectAllTreatmentSessions } from '../../../../store/treatment-sessions/treatment-sessions.selectors';
import { TreatmentSessionsActions } from '../../../../store/treatment-sessions/treatment-sessions.actions';
import { TreatmentInstanceService } from '../../../../core/services/treatment-instance.service';
import { NotificationsActions } from '../../../../store/notifications/notifications.actions';

@Component({
  selector: 'app-apiary-view',
  standalone: true,
  imports: [DatePipe, RouterLink, WeatherCardComponent, CardComponent],
  templateUrl: './apiary-view.html',
  styleUrl: './apiary-view.scss',
})
export class ApiaryViewComponent implements OnInit {
  private route             = inject(ActivatedRoute);
  private apiaryService     = inject(ApiaryService);
  private agendaService     = inject(AgendaService);
  private inspectionService = inject(InspectionService);
  private instanceService   = inject(TreatmentInstanceService);
  private store             = inject(Store);
  private sanitizer         = inject(DomSanitizer);

  today       = new Date().toISOString().slice(0, 10);
  apiary      = signal<Apiary | null>(null);
  inspections = signal<Inspection[]>([]);
  todos       = signal<AgendaItem[]>([]);
  doneIds     = signal<Set<number>>(new Set());
  loading     = signal(true);

  allSessions   = this.store.selectSignal(selectAllTreatmentSessions);
  sessions      = computed(() =>
    this.allSessions().filter(s => s.apiaryId === this.apiary()?.id)
  );

  pendingTodos = computed(() =>
    this.todos().filter(t => !this.doneIds().has(t.entityId))
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(TreatmentSessionsActions.load());

    this.apiaryService.getApiary(id).subscribe(res => {
      this.apiary.set(res.data);
      this.loading.set(false);
    });

    this.inspectionService.getInspectionsOfApiary(id).subscribe(res => {
      this.inspections.set(
        [...(res.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
      );
    });

    this.agendaService.getByApiary(id).subscribe(items => {
      this.todos.set(items);
    });
  }

  markDone(item: AgendaItem): void {
    if (item.entityType !== 'treatment_instance') return;
    this.instanceService.update(item.entityId, { status: 'done' }).subscribe({
      next: () => {
        this.doneIds.update(s => new Set([...s, item.entityId]));
        this.store.dispatch(NotificationsActions.reload());
      },
    });
  }

  typeIcon(type: string): SafeHtml {
    const svg = type === 'treatment'
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
