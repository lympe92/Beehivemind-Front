import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  Feeding,
  FEEDING_TYPES,
  FOOD_TYPES,
  FEEDING_UNITS,
  FeedingType,
  FoodType,
  FeedingUnit,
} from '../../../core/models/feeding.model';
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
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';

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
    const apiaries = this.apiaries();
    const allBeehives = this.allBeehives();

    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Add Feeding Record',
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
            name: 'feeding_type',
            type: 'select',
            label: 'Feeding Type',
            size: 'half',
            value: 'stimulation',
            syncValidators: [syncValidators.required()],
            options: of(FEEDING_TYPES.map(ft => ({ displayValue: ft.label, returnValue: ft.value }))),
          },
          {
            name: 'food_type',
            type: 'select',
            label: 'Food Type',
            size: 'half',
            value: 'sugar syrup',
            syncValidators: [syncValidators.required()],
            options: of(FOOD_TYPES.map(ft => ({ displayValue: ft.label, returnValue: ft.value }))),
          },
          {
            name: 'food_quantity',
            type: 'number',
            label: 'Qty / Beehive',
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
            options: of(FEEDING_UNITS.map(u => ({ displayValue: u.label, returnValue: u.value }))),
          },
        ],
      },
    });

    if (!value) return;

    const beehiveId = value.beehive_id ? Number(value.beehive_id) : null;

    if (beehiveId) {
      const duplicate = this.allFeeding().some(
        f => f.beehiveId === beehiveId && f.date === value.date
      );
      if (duplicate) {
        const beehiveName = allBeehives.find(b => b.id === beehiveId)?.name ?? '';
        this.toast.warning(`A record for ${value.date} on beehive "${beehiveName}" already exists. Edit that record instead.`);
        return;
      }
    }

    const payload: { date: string; feeding_type: FeedingType; food_type: FoodType; food_quantity: number; unit: FeedingUnit; beehive_id?: number; apiary_id?: number } = {
      date: value.date,
      feeding_type: value.feeding_type,
      food_type: value.food_type,
      food_quantity: Number(value.food_quantity),
      unit: value.unit,
    };
    if (beehiveId) {
      payload.beehive_id = beehiveId;
    } else {
      payload.apiary_id = Number(value.apiary_id);
    }

    this.feedingService.createFeeding(payload).subscribe({
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
    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '640px',
      data: {
        title: 'Edit Feeding Record',
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
            name: 'feeding_type',
            type: 'select',
            label: 'Feeding Type',
            size: 'half',
            value: row.feeding_type,
            syncValidators: [syncValidators.required()],
            options: of(FEEDING_TYPES.map(ft => ({ displayValue: ft.label, returnValue: ft.value }))),
          },
          {
            name: 'food_type',
            type: 'select',
            label: 'Food Type',
            size: 'half',
            value: row.food_type,
            syncValidators: [syncValidators.required()],
            options: of(FOOD_TYPES.map(ft => ({ displayValue: ft.label, returnValue: ft.value }))),
          },
          {
            name: 'food_quantity',
            type: 'number',
            label: 'Qty / Beehive',
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
            options: of(FEEDING_UNITS.map(u => ({ displayValue: u.label, returnValue: u.value }))),
          },
        ],
      },
    });
    if (!value) return;

    this.feedingService.updateFeeding(row.id, {
      date: value.date,
      feeding_type: value.feeding_type,
      food_type: value.food_type,
      food_quantity: Number(value.food_quantity),
      unit: value.unit,
    }).subscribe({
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
