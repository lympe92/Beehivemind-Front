import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Feeding } from '../../../core/models/feeding.model';
import { FeedingService } from '../../../core/services/feeding.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { FeedingActions } from '../../../store/feeding/feeding.actions';
import { selectAllFeeding, selectFeedingLoading } from '../../../store/feeding/feeding.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import {
  AddFeedingModalComponent,
  AddFeedingModalData,
  AddFeedingModalResult,
} from '../../../shared/components/ui/modal/add-feeding-modal/add-feeding-modal';

@Component({
  selector: 'app-feeding',
  standalone: true,
  imports: [DataTableComponent, CardComponent, FilterBarComponent],
  templateUrl: './feeding.html',
  styleUrl: './feeding.scss',
})
export class FeedingComponent implements OnInit {
  private store = inject(Store);
  private feedingService = inject(FeedingService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly columns: ColumnDef[] = [
    { key: 'date', label: 'Date' },
    { key: 'feeding_type', label: 'Feeding Type' },
    { key: 'food_type', label: 'Food Type' },
    { key: 'food_quantity', label: 'Qty / Beehive' },
    { key: 'unit', label: 'Unit' },
  ];

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allFeeding = this.store.selectSignal(selectAllFeeding);
  loading = this.store.selectSignal(selectFeedingLoading);

  beehives = computed(() =>
    this.allBeehives().filter(b => b.apiaryId === this.selectedApiaryId())
  );

  feeding = computed(() => {
    const all = this.allFeeding();
    const beehiveId = this.selectedBeehiveId();
    const apiaryId = this.selectedApiaryId();

    if (beehiveId !== 0) return all.filter(r => r.beehiveId === beehiveId);
    if (apiaryId !== 0) {
      const ids = new Set(this.allBeehives().filter(b => b.apiaryId === apiaryId).map(b => b.id));
      return all.filter(r => ids.has(r.beehiveId));
    }
    return all;
  });

  selectedApiaryId = signal<number>(0);
  selectedBeehiveId = signal<number>(0);

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(FeedingActions.load());
  }

  // ── Filter handlers ──────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId.set(apiaryId);
    this.selectedBeehiveId.set(0);
  }

  onBeehiveChange(beehiveId: number): void {
    this.selectedBeehiveId.set(beehiveId);
  }

  // ── Add ──────────────────────────────────────────────────

  async startAdd(): Promise<void> {
    const result = await this.modal.open<AddFeedingModalResult, AddFeedingModalData>(
      AddFeedingModalComponent,
      {
        type: 'center',
        width: '640px',
        data: {
          apiaries: this.apiaries(),
          allBeehives: this.allBeehives(),
          preselectedApiaryId: this.selectedApiaryId(),
          preselectedBeehiveId: this.selectedBeehiveId(),
        },
      },
    );

    if (!result) return;

    if (result.beehive_id) {
      const duplicate = this.allFeeding().some(
        f => f.beehiveId === result.beehive_id && f.date === result.date
      );
      if (duplicate) {
        const beehiveName = this.allBeehives().find(b => b.id === result.beehive_id)?.name ?? '';
        this.toast.warning(`A record for ${result.date} on beehive "${beehiveName}" already exists. Edit that record instead.`);
        return;
      }
    }

    this.feedingService.createFeeding(result).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(FeedingActions.reload());
          this.toast.success('Record created successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  async startEdit(row: Feeding): Promise<void> {
    const result = await this.modal.open<AddFeedingModalResult, AddFeedingModalData>(
      AddFeedingModalComponent,
      {
        type: 'center',
        width: '640px',
        data: {
          apiaries: this.apiaries(),
          allBeehives: this.allBeehives(),
          preselectedApiaryId: 0,
          preselectedBeehiveId: 0,
          editRow: row,
        },
      },
    );
    if (!result) return;

    const { beehive_id, ...payload } = result;
    this.feedingService.updateFeeding(row.id, payload).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(FeedingActions.reload());
          this.toast.success('Record updated successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(row: Feeding): Promise<void> {
    const beehiveName = this.allBeehives().find(b => b.id === row.beehiveId)?.name ?? '';
    const confirmed = await this.modal.confirm({
      title: 'Delete Record',
      message: `Delete feeding record${beehiveName ? ` for beehive "${beehiveName}"` : ''} on ${row.date}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.feedingService.deleteFeeding(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(FeedingActions.reload());
          this.toast.success('Record deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }
}
