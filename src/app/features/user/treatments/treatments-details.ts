import { Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TreatmentSession } from '../../../core/models/treatment-session.model';
import { TreatmentSessionService } from '../../../core/services/treatment-session.service';
import { TreatmentSessionsActions } from '../../../store/treatment-sessions/treatment-sessions.actions';
import { TreatmentTypesActions } from '../../../store/treatment-types/treatment-types.actions';
import { selectAllTreatmentSessions, selectTreatmentSessionsLoaded, selectTreatmentSessionsLoading } from '../../../store/treatment-sessions/treatment-sessions.selectors';
import { selectAllTreatmentTypes, selectTreatmentTypesLoaded } from '../../../store/treatment-types/treatment-types.selectors';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { selectAllBeehives, selectBeehivesLoaded } from '../../../store/beehives/beehives.selectors';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state';
import { TooltipDirective } from '../../../shared/components/ui/tooltip/tooltip.directive';
import { RecordMetaComponent } from '../../../shared/components/ui/record-meta/record-meta';
import { TreatmentSessionModalComponent } from '../../../shared/components/ui/modal/treatment-session-modal/treatment-session-modal';

@Component({
  selector: 'app-treatments-details',
  standalone: true,
  imports: [DatePipe, CardComponent, TooltipDirective, RecordMetaComponent, EmptyStateComponent],
  templateUrl: './treatments-details.html',
})
export class TreatmentsDetailsComponent implements OnInit {
  private store          = inject(Store);
  private sessionService = inject(TreatmentSessionService);
  private toast          = inject(ToastService);
  private modal          = inject(ModalService);
  private router         = inject(Router);

  readonly sessions        = this.store.selectSignal(selectAllTreatmentSessions);
  readonly sessionsLoading = this.store.selectSignal(selectTreatmentSessionsLoading);
  readonly types           = this.store.selectSignal(selectAllTreatmentTypes);
  readonly apiaries        = this.store.selectSignal(selectAllApiaries);
  private readonly sessionsLoaded = this.store.selectSignal(selectTreatmentSessionsLoaded);
  private readonly typesLoaded    = this.store.selectSignal(selectTreatmentTypesLoaded);
  private readonly beehives       = this.store.selectSignal(selectAllBeehives);
  private readonly beehivesLoaded = this.store.selectSignal(selectBeehivesLoaded);

  /**
   * No session at all: 'none' invites the first; a session needs a type and
   * hives, so without either the page sends to the one that is missing.
   * Null while any of the three slices is loading, or when there are sessions.
   */
  readonly emptyState = computed<'none' | 'no-type' | 'no-hive' | null>(() => {
    if (!this.sessionsLoaded() || this.sessions().length > 0) return null;
    if (!this.typesLoaded() || !this.beehivesLoaded()) return null;
    if (this.types().length === 0) return 'no-type';
    if (this.beehives().length === 0) return 'no-hive';
    return 'none';
  });

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  ngOnInit(): void {
    this.store.dispatch(TreatmentSessionsActions.load());
    this.store.dispatch(TreatmentTypesActions.load());
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  async applyTreatment(): Promise<void> {
    const result = await this.modal.open<{
      treatmentTypeId: number;
      apiaryId: number | null;
      startDate: string;
      beehiveIds: number[];
      notes: string | null;
    }>(TreatmentSessionModalComponent, {
      type: 'center',
      width: '560px',
      data: { types: this.types() },
    });
    if (!result) return;

    this.sessionService.create(result).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TreatmentSessionsActions.reload());
          this.toast.success('Treatment session started.');
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

  apiaryName(id: number | null): string {
    if (!id) return 'All Apiaries';
    return this.apiaries().find(a => a.id === id)?.name ?? '—';
  }

  instancesDone(session: TreatmentSession): number {
    return session.instances.filter(i => i.status === 'done').length;
  }
}
