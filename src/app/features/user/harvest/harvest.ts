import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface HarvestForm {
  date: string;
  honey_type: HarvestType;
  honey_description: string;
  food_quantity: number | null;
  unit: HarvestUnit;
}

@Component({
  selector: 'app-harvest',
  standalone: true,
  imports: [FormsModule, DataTableComponent, CardComponent, FilterBarComponent],
  templateUrl: './harvest.html',
  styleUrl: './harvest.scss',
})
export class HarvestComponent implements OnInit {
  private store = inject(Store);
  private harvestService = inject(HarvestService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly HARVEST_TYPES = HARVEST_TYPES;
  readonly HARVEST_UNITS = HARVEST_UNITS;

  columns = computed<ColumnDef[]>(() => {
    const base: ColumnDef[] = [
      { key: 'date', label: 'Date' },
      { key: 'honey_type', label: 'Type' },
      { key: 'honey_description', label: 'Description' },
      { key: 'food_quantity', label: 'Total Quantity' },
      { key: 'unit', label: 'Unit' },
    ];
    if (this.selectedApiaryId() !== 0 && !this.canEdit) {
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

  editingId: number | null = null;
  editForm: HarvestForm = this.blank();

  showAddForm = false;
  newForm: HarvestForm = this.blank();

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(HarvestActions.load());
  }

  // ── Filter handlers ──────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId.set(apiaryId);
    this.selectedBeehiveId.set(0);
    this.cancelEdit();
    this.cancelAdd();
  }

  onBeehiveChange(beehiveId: number): void {
    this.selectedBeehiveId.set(beehiveId);
    this.cancelEdit();
    this.cancelAdd();
  }

  // ── Add ──────────────────────────────────────────────────

  startAdd(): void {
    this.cancelEdit();
    this.newForm = this.blank();
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
  }

  confirmAdd(): void {
    if (!this.validate(this.newForm)) return;

    if (this.selectedBeehiveId() !== 0) {
      const duplicate = this.harvest().some(h => h.date === this.newForm.date);
      if (duplicate) {
        const beehiveName = this.allBeehives().find(b => b.id === this.selectedBeehiveId())?.name ?? '';
        this.toast.warning(
          `A record for ${this.newForm.date} on beehive "${beehiveName}" already exists.`
        );
        return;
      }
    }

    const payload = {
      ...this.newForm,
      food_quantity: Number(this.newForm.food_quantity),
      honey_description: this.newForm.honey_type === 'honey' ? this.newForm.honey_description : '',
      ...(this.selectedBeehiveId() !== 0
        ? { beehive_id: this.selectedBeehiveId() }
        : { apiary_id: this.selectedApiaryId() }),
    };

    this.harvestService.createHarvest(payload).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
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

  startEdit(row: Harvest): void {
    this.cancelAdd();
    this.editingId = row.id;
    this.editForm = {
      date: row.date,
      honey_type: row.honey_type,
      honey_description: row.honey_description,
      food_quantity: row.food_quantity,
      unit: row.unit,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null || !this.validate(this.editForm)) return;

    this.harvestService.updateHarvest(this.editingId, {
      ...this.editForm,
      food_quantity: Number(this.editForm.food_quantity),
      honey_description: this.editForm.honey_type === 'honey' ? this.editForm.honey_description : '',
    }).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
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
    if (this.selectedBeehiveId() !== 0) {
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
          if (res.success) { this.store.dispatch(HarvestActions.reload()); this.toast.success('Record deleted.'); }
          else this.toast.error('Something went wrong. Please try again.');
        },
        error: () => this.toast.error('Something went wrong. Please try again.'),
      });
    } else {
      const apiaryName = this.apiaries().find(a => a.id === this.selectedApiaryId())?.name ?? '';
      const confirmed = await this.modal.confirm({
        title: 'Delete Records',
        message: `Delete ALL harvest records for apiary "${apiaryName}" on ${row.date}? This will delete records for all beehives on that date.`,
        confirmLabel: 'Delete All',
        danger: true,
      });
      if (!confirmed) return;

      this.harvestService.deleteHarvestByApiaryAndDate(this.selectedApiaryId(), row.date).subscribe({
        next: res => {
          if (res.success) { this.store.dispatch(HarvestActions.reload()); this.toast.success('Records deleted.'); }
          else this.toast.error('Something went wrong. Please try again.');
        },
        error: () => this.toast.error('Something went wrong. Please try again.'),
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  get canAdd(): boolean {
    return this.selectedApiaryId() !== 0;
  }

  get canEdit(): boolean {
    return this.selectedBeehiveId() !== 0;
  }

  getBeehiveName(beehiveId: number): string {
    return this.allBeehives().find(b => b.id === beehiveId)?.name ?? '—';
  }

  private validate(form: HarvestForm): boolean {
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      this.toast.error('Date must be a valid date (yyyy-mm-dd).');
      return false;
    }
    if (form.food_quantity === null || isNaN(Number(form.food_quantity)) || Number(form.food_quantity) < 0) {
      this.toast.error('Quantity must be a valid positive number.');
      return false;
    }
    return true;
  }

  private blank(): HarvestForm {
    return {
      date: new Date().toISOString().split('T')[0],
      honey_type: 'honey',
      honey_description: '',
      food_quantity: null,
      unit: 'kg',
    };
  }
}
