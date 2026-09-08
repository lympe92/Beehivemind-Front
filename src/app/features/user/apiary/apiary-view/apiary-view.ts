import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ApiaryService } from '../../../../core/services/apiary.service';
import { AgendaService } from '../../../../core/services/agenda.service';
import { InspectionService } from '../../../../core/services/inspection.service';
import { TreatmentSessionService } from '../../../../core/services/treatment-session.service';
import { Apiary } from '../../../../core/models/apiary.model';
import { Inspection } from '../../../../core/models/inspection.model';
import { AgendaItem } from '../../../../core/models/agenda-item.model';
import { TreatmentSession } from '../../../../core/models/treatment-session.model';
import { WeatherCardComponent } from '../../../../shared/components/ui/weather-card/weather-card';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../../shared/components/ui/callout/callout';
import { ColumnDef, DataTableComponent } from '../../../../shared/components/ui/data-table/data-table';
import { ApiaryFormModalComponent } from '../../../../shared/components/ui/modal/apiary-form-modal/apiary-form-modal';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { selectAllTreatmentSessions } from '../../../../store/treatment-sessions/treatment-sessions.selectors';
import { TreatmentSessionsActions } from '../../../../store/treatment-sessions/treatment-sessions.actions';
import { selectAllBeehives } from '../../../../store/beehives/beehives.selectors';
import { BeehivesActions } from '../../../../store/beehives/beehives.actions';
import { ApiariesActions } from '../../../../store/apiaries/apiaries.actions';

/**
 * One apiary: the weather where it stands, two figures (hives, pending
 * to-dos), its recent inspections and its treatment sessions — the same shape
 * as the design system's ApiaryViewPage.
 */
@Component({
  selector: 'app-apiary-view',
  standalone: true,
  imports: [DatePipe, WeatherCardComponent, CardComponent, CalloutComponent, DataTableComponent],
  templateUrl: './apiary-view.html',
})
export class ApiaryViewComponent implements OnInit {
  private route             = inject(ActivatedRoute);
  private apiaryService     = inject(ApiaryService);
  private agendaService     = inject(AgendaService);
  private inspectionService = inject(InspectionService);
  private sessionService    = inject(TreatmentSessionService);
  private store             = inject(Store);
  private toast             = inject(ToastService);
  private modal             = inject(ModalService);

  readonly inspectionColumns: ColumnDef[] = [
    { key: 'beehiveId', label: 'Beehive', width: '30%' },
    { key: 'date', label: 'Date' },
    { key: 'population', label: 'Population' },
    { key: 'honey', label: 'Honey' },
  ];

  apiary      = signal<Apiary | null>(null);
  inspections = signal<Inspection[]>([]);
  todos       = signal<AgendaItem[]>([]);
  loading     = signal(true);

  private beehives  = this.store.selectSignal(selectAllBeehives);
  private allSessions = this.store.selectSignal(selectAllTreatmentSessions);

  readonly sessions = computed(() =>
    this.allSessions().filter(s => s.apiaryId === this.apiary()?.id)
  );

  ngOnInit(): void {
    this.store.dispatch(TreatmentSessionsActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.load();
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.apiaryService.getApiary(id).subscribe(res => {
      this.apiary.set(res.data);
      this.loading.set(false);
    });

    this.inspectionService.getInspectionsOfApiary(id).subscribe(res => {
      this.inspections.set(
        [...(res.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
      );
    });

    this.agendaService.getByApiary(id).subscribe(items => this.todos.set(items));
  }

  beehiveName(id: number): string {
    return this.beehives().find(b => b.id === id)?.name ?? `#${id}`;
  }

  instancesDone(session: TreatmentSession): number {
    return session.instances.filter(i => i.status === 'done').length;
  }

  async edit(): Promise<void> {
    const apiary = this.apiary();
    if (!apiary) return;

    const value = await this.modal.open<{
      name: string;
      hivesNumber: number;
      latitude: number;
      longitude: number;
      location?: string | null;
      dateEstablished?: string | null;
    }>(ApiaryFormModalComponent, {
      type: 'center',
      width: '640px',
      data: { apiary },
    });
    if (!value) return;

    this.apiaryService.updateApiary(apiary.id, {
      name: value.name.trim(),
      hivesNumber: Number(value.hivesNumber) || 0,
      latitude: value.latitude,
      longitude: value.longitude,
      location: value.location || null,
      dateEstablished: value.dateEstablished || null,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(ApiariesActions.reload());
          this.load();
          this.toast.success('Apiary updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async deleteSession(session: TreatmentSession): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Session',
      message: 'Delete this treatment session? All instances will be removed.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.sessionService.delete(session.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TreatmentSessionsActions.reload());
          this.toast.success('Session deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }
}
