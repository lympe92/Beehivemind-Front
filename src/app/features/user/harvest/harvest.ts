import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Harvest } from '../../../core/models/harvest.model';
import { HarvestService } from '../../../core/services/harvest.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { HarvestActions } from '../../../store/harvest/harvest.actions';
import { selectAllHarvest, selectHarvestLoading } from '../../../store/harvest/harvest.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import {
  AddHarvestModalComponent,
  AddHarvestModalData,
  AddHarvestModalResult,
} from '../../../shared/components/ui/modal/add-harvest-modal/add-harvest-modal';

@Component({
  selector: 'app-harvest',
  standalone: true,
  imports: [DataTableComponent, CardComponent, FilterBarComponent],
  templateUrl: './harvest.html',
  styleUrl: './harvest.scss',
})
export class HarvestComponent implements OnInit {
  private store = inject(Store);
  private harvestService = inject(HarvestService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  columns = computed<ColumnDef[]>(() => {
    const base: ColumnDef[] = [
      { key: 'date', label: 'Date' },
      { key: 'honey_type', label: 'Type' },
      { key: 'honey_description', label: 'Description' },
      { key: 'food_quantity', label: 'Total Quantity' },
      { key: 'unit', label: 'Unit' },
    ];
    if (this.selectedApiaryId() !== 0 && this.selectedBeehiveId() === 0) {
      return [...base, { key: 'beehiveId', label: 'Beehive' }];
    }
    return base;
  });

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allHarvest = this.store.selectSignal(selectAllHarvest);
  loading = this.store.selectSignal(selectHarvestLoading);

  beehives = computed(() =>
    this.allBeehives().filter(b => b.apiaryId === this.selectedApiaryId())
  );

  harvest = computed(() => {
    const all = this.allHarvest();
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
    this.store.dispatch(HarvestActions.load());
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
    const result = await this.modal.open<AddHarvestModalResult, AddHarvestModalData>(
      AddHarvestModalComponent,
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
      const duplicate = this.allHarvest().some(
        h => h.beehiveId === result.beehive_id && h.date === result.date
      );
      if (duplicate) {
        const beehiveName = this.allBeehives().find(b => b.id === result.beehive_id)?.name ?? '';
        this.toast.warning(`A record for ${result.date} on beehive "${beehiveName}" already exists.`);
        return;
      }
    }

    this.harvestService.createHarvest(result).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(HarvestActions.reload());
          this.toast.success('Record created successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  async startEdit(row: Harvest): Promise<void> {
    const result = await this.modal.open<AddHarvestModalResult, AddHarvestModalData>(
      AddHarvestModalComponent,
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
    this.harvestService.updateHarvest(row.id, payload).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(HarvestActions.reload());
          this.toast.success('Record updated successfully.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(row: Harvest): Promise<void> {
    const beehiveName = this.allBeehives().find(b => b.id === row.beehiveId)?.name ?? '';
    const confirmed = await this.modal.confirm({
      title: 'Delete Record',
      message: `Delete harvest record for beehive "${beehiveName}" on ${row.date}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.harvestService.deleteHarvest(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(HarvestActions.reload());
          this.toast.success('Record deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  getBeehiveName(beehiveId: number): string {
    return this.allBeehives().find(b => b.id === beehiveId)?.name ?? '—';
  }
}
