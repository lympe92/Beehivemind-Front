import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  Harvest,
  HARVEST_TYPES,
  HARVEST_UNITS,
  HarvestType,
  HarvestUnit,
} from '../../../core/models/harvest.model';
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
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';

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
    const apiaries = this.apiaries();
    const allBeehives = this.allBeehives();

    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Add Harvest Record',
        fields: [
          {
            name: 'apiary_id',
            type: 'select',
            label: 'Apiary',
            size: 'half',
            value: this.selectedApiaryId() || null,
            syncValidators: [syncValidators.required()],
            options: of(apiaries.map(a => ({ displayValue: a.name, returnValue: a.id }))),
          },
          {
            name: 'beehive_id',
            type: 'select',
            label: 'Beehive',
            size: 'half',
            value: this.selectedBeehiveId() || null,
            cascadeFrom: 'apiary_id',
            options: (apiaryId: number) => of([
              { displayValue: '— All beehives —', returnValue: null },
              ...allBeehives
                .filter(b => b.apiaryId === apiaryId)
                .map(b => ({ displayValue: b.name, returnValue: b.id })),
            ]),
          },
          {
            name: 'date',
            type: 'date',
            label: 'Date',
            size: 'half',
            value: new Date().toISOString().split('T')[0],
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'honey_type',
            type: 'select',
            label: 'Type',
            size: 'half',
            value: 'honey',
            syncValidators: [syncValidators.required()],
            options: of(HARVEST_TYPES.map(ht => ({ displayValue: ht.label, returnValue: ht.value }))),
          },
          {
            name: 'honey_description',
            type: 'text',
            label: 'Description (honey only)',
            size: 'full',
            value: '',
          },
          {
            name: 'food_quantity',
            type: 'number',
            label: 'Total Quantity',
            size: 'half',
            value: null,
            syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9_999_999 })],
          },
          {
            name: 'unit',
            type: 'select',
            label: 'Unit',
            size: 'half',
            value: 'kg',
            syncValidators: [syncValidators.required()],
            options: of(HARVEST_UNITS.map(u => ({ displayValue: u.label, returnValue: u.value }))),
          },
        ],
      },
    });

    if (!value) return;

    const beehiveId = value.beehive_id ? Number(value.beehive_id) : null;

    if (beehiveId) {
      const duplicate = this.allHarvest().some(
        h => h.beehiveId === beehiveId && h.date === value.date
      );
      if (duplicate) {
        const beehiveName = allBeehives.find(b => b.id === beehiveId)?.name ?? '';
        this.toast.warning(`A record for ${value.date} on beehive "${beehiveName}" already exists.`);
        return;
      }
    }

    const payload: { date: string; honey_type: HarvestType; honey_description: string; food_quantity: number; unit: HarvestUnit; beehive_id?: number; apiary_id?: number } = {
      date: value.date,
      honey_type: value.honey_type,
      honey_description: value.honey_type === 'honey' ? (value.honey_description ?? '') : '',
      food_quantity: Number(value.food_quantity),
      unit: value.unit,
    };
    if (beehiveId) {
      payload.beehive_id = beehiveId;
    } else {
      payload.apiary_id = Number(value.apiary_id);
    }

    this.harvestService.createHarvest(payload).subscribe({
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
    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Edit Harvest Record',
        fields: [
          {
            name: 'date',
            type: 'date',
            label: 'Date',
            size: 'half',
            value: row.date,
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'honey_type',
            type: 'select',
            label: 'Type',
            size: 'half',
            value: row.honey_type,
            syncValidators: [syncValidators.required()],
            options: of(HARVEST_TYPES.map(ht => ({ displayValue: ht.label, returnValue: ht.value }))),
          },
          {
            name: 'honey_description',
            type: 'text',
            label: 'Description (honey only)',
            size: 'full',
            value: row.honey_description,
          },
          {
            name: 'food_quantity',
            type: 'number',
            label: 'Total Quantity',
            size: 'half',
            value: row.food_quantity,
            syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9_999_999 })],
          },
          {
            name: 'unit',
            type: 'select',
            label: 'Unit',
            size: 'half',
            value: row.unit,
            syncValidators: [syncValidators.required()],
            options: of(HARVEST_UNITS.map(u => ({ displayValue: u.label, returnValue: u.value }))),
          },
        ],
      },
    });
    if (!value) return;

    this.harvestService.updateHarvest(row.id, {
      date: value.date,
      honey_type: value.honey_type,
      honey_description: value.honey_type === 'honey' ? (value.honey_description ?? '') : '',
      food_quantity: Number(value.food_quantity),
      unit: value.unit,
    }).subscribe({
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
