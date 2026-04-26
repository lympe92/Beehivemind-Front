import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { TreatmentSession } from '../../../core/models/treatment-session.model';
import { TreatmentSessionService } from '../../../core/services/treatment-session.service';
import { TreatmentSessionsActions } from '../../../store/treatment-sessions/treatment-sessions.actions';
import { TreatmentTypesActions } from '../../../store/treatment-types/treatment-types.actions';
import { selectAllTreatmentSessions, selectTreatmentSessionsLoading } from '../../../store/treatment-sessions/treatment-sessions.selectors';
import { selectAllTreatmentTypes } from '../../../store/treatment-types/treatment-types.selectors';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { TreatmentSessionModalComponent } from '../../../shared/components/ui/modal/treatment-session-modal/treatment-session-modal';

@Component({
  selector: 'app-treatments-details',
  standalone: true,
  imports: [DatePipe, CardComponent],
  templateUrl: './treatments-details.html',
  styleUrl: './treatments-details.scss',
})
export class TreatmentsDetailsComponent implements OnInit {
  private store          = inject(Store);
  private sessionService = inject(TreatmentSessionService);
  private toast          = inject(ToastService);
  private modal          = inject(ModalService);

  readonly sessions        = this.store.selectSignal(selectAllTreatmentSessions);
  readonly sessionsLoading = this.store.selectSignal(selectTreatmentSessionsLoading);
  readonly types           = this.store.selectSignal(selectAllTreatmentTypes);
  readonly apiaries        = this.store.selectSignal(selectAllApiaries);

  ngOnInit(): void {
    this.store.dispatch(TreatmentSessionsActions.load());
    this.store.dispatch(TreatmentTypesActions.load());
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  async applyTreatment(): Promise<void> {
    const result = await this.modal.open<any>(TreatmentSessionModalComponent, {
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
      error: () => this.toast.error('Something went wrong. Please try again.'),
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
      error: () => this.toast.error('Something went wrong. Please try again.'),
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
