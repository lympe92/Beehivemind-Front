import { Component, computed, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TreatmentType } from '../../../core/models/treatment-type.model';
import { TreatmentTypeService } from '../../../core/services/treatment-type.service';
import { TreatmentTypesActions } from '../../../store/treatment-types/treatment-types.actions';
import { TreatmentSessionsActions } from '../../../store/treatment-sessions/treatment-sessions.actions';
import { selectAllTreatmentTypes, selectTreatmentTypesLoaded, selectTreatmentTypesLoading } from '../../../store/treatment-types/treatment-types.selectors';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state';
import { TreatmentTypeModalComponent } from '../../../shared/components/ui/modal/treatment-type-modal/treatment-type-modal';
import { TreatmentSessionModalComponent } from '../../../shared/components/ui/modal/treatment-session-modal/treatment-session-modal';
import { TreatmentSessionService } from '../../../core/services/treatment-session.service';
import { onDeepLink } from '../../../core/onboarding/deep-link';
import { selectApiariesLoaded } from '../../../store/apiaries/apiaries.selectors';
import { selectBeehivesLoaded } from '../../../store/beehives/beehives.selectors';

@Component({
  selector: 'app-treatments',
  standalone: true,
  imports: [CardComponent, EmptyStateComponent],
  templateUrl: './treatments.html',
})
export class TreatmentsComponent implements OnInit {
  private store          = inject(Store);
  private typeService    = inject(TreatmentTypeService);
  private sessionService = inject(TreatmentSessionService);
  private toast          = inject(ToastService);
  private modal          = inject(ModalService);

  readonly types        = this.store.selectSignal(selectAllTreatmentTypes);
  readonly typesLoading = this.store.selectSignal(selectTreatmentTypesLoading);
  private readonly typesLoaded = this.store.selectSignal(selectTreatmentTypesLoaded);

  /** Loaded and none at all: the page says what a treatment type is. */
  readonly typesEmpty = computed(() => this.typesLoaded() && this.types().length === 0);

  private readonly apiariesLoaded = this.store.selectSignal(selectApiariesLoaded);
  private readonly beehivesLoaded = this.store.selectSignal(selectBeehivesLoaded);

  /**
   * `?add=type` opens New treatment type; `?add=session` opens Apply
   * treatment on the newest type (none yet: New treatment type instead).
   */
  private readonly addLink = onDeepLink(
    ['add'],
    () => this.typesLoaded() && this.apiariesLoaded() && this.beehivesLoaded(),
    link => {
      const types = this.types();
      if (link['add'] === 'session' && types.length) this.applyType(types.reduce((a, b) => (b.id > a.id ? b : a)));
      else this.addType();
    },
  );

  ngOnInit(): void {
    this.store.dispatch(TreatmentTypesActions.load());
    this.store.dispatch(TreatmentSessionsActions.load());
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  async addType(): Promise<void> {
    const result = await this.modal.open<Partial<TreatmentType>>(TreatmentTypeModalComponent, {
      type: 'center',
      width: '560px',
      data: {},
    });
    if (!result) return;

    this.typeService.create(result).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TreatmentTypesActions.reload());
          this.toast.success('Treatment type created.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async editType(type: TreatmentType): Promise<void> {
    const result = await this.modal.open<Partial<TreatmentType>>(TreatmentTypeModalComponent, {
      type: 'center',
      width: '560px',
      data: { type },
    });
    if (!result) return;

    this.typeService.update(type.id, result).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TreatmentTypesActions.reload());
          this.toast.success('Treatment type updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async deleteType(type: TreatmentType): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Treatment Type',
      message: `Delete "${type.name}"? All associated sessions will also be deleted.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.typeService.delete(type.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(TreatmentTypesActions.reload());
          this.store.dispatch(TreatmentSessionsActions.reload());
          this.toast.success('Treatment type deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  async applyType(type: TreatmentType): Promise<void> {
    const result = await this.modal.open<{
      treatmentTypeId: number;
      apiaryId: number | null;
      startDate: string;
      beehiveIds: number[];
      notes: string | null;
    }>(TreatmentSessionModalComponent, {
      type: 'center',
      width: '560px',
      data: {
        types: this.types(),
        preselectedTypeId: type.id,
      },
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
}
