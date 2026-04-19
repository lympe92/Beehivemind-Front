import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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

interface FeedingForm {
  date: string;
  feeding_type: FeedingType;
  food_type: FoodType;
  food_quantity: number | null;
  unit: FeedingUnit;
}

@Component({
  selector: 'app-feeding',
  standalone: true,
  imports: [FormsModule, DataTableComponent, CardComponent, FilterBarComponent],
  templateUrl: './feeding.html',
  styleUrl: './feeding.scss',
})
export class FeedingComponent implements OnInit {
  private store = inject(Store);
  private feedingService = inject(FeedingService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly FEEDING_TYPES = FEEDING_TYPES;
  readonly FOOD_TYPES = FOOD_TYPES;
  readonly FEEDING_UNITS = FEEDING_UNITS;

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

  editingId: number | null = null;
  editForm: FeedingForm = this.blankForm();

  showAddForm = false;
  newForm: FeedingForm = this.blankForm();

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(FeedingActions.load());
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
    this.newForm = this.blankForm();
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
  }

  confirmAdd(): void {
    if (!this.validateForm(this.newForm)) return;

    if (this.selectedBeehiveId() !== 0) {
      const duplicate = this.feeding().some(f => f.date === this.newForm.date);
      if (duplicate) {
        const beehiveName = this.allBeehives().find(b => b.id === this.selectedBeehiveId())?.name ?? '';
        this.toast.warning(
          `A record for ${this.newForm.date}${beehiveName ? ` on beehive "${beehiveName}"` : ''} already exists. Edit that record instead.`
        );
        return;
      }
    }

    const payload = {
      ...this.newForm,
      food_quantity: Number(this.newForm.food_quantity),
      ...(this.selectedBeehiveId() !== 0
        ? { beehive_id: this.selectedBeehiveId() }
        : { apiary_id: this.selectedApiaryId() }),
    };

    this.feedingService.createFeeding(payload).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
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

  startEdit(row: Feeding): void {
    this.cancelAdd();
    this.editingId = row.id;
    this.editForm = {
      date: row.date,
      feeding_type: row.feeding_type,
      food_type: row.food_type,
      food_quantity: row.food_quantity,
      unit: row.unit,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null) return;
    if (!this.validateForm(this.editForm)) return;

    this.feedingService.updateFeeding(this.editingId, {
      ...this.editForm,
      food_quantity: Number(this.editForm.food_quantity),
    }).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
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

  // ── Helpers ──────────────────────────────────────────────

  get canAdd(): boolean {
    return this.selectedApiaryId() !== 0;
  }

  get canEdit(): boolean {
    return this.selectedBeehiveId() !== 0;
  }

  private validateForm(form: FeedingForm): boolean {
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

  private blankForm(): FeedingForm {
    return {
      date: new Date().toISOString().split('T')[0],
      feeding_type: 'stimulation',
      food_type: 'sugar syrup',
      food_quantity: null,
      unit: 'kg',
    };
  }
}
