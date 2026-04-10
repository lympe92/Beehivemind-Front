import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../core/models/apiary.model';
import { Beehive } from '../../../core/models/beehive.model';
import {
  Harvest,
  HARVEST_TYPES,
  HARVEST_UNITS,
  HarvestType,
  HarvestUnit,
} from '../../../core/models/harvest.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { BeehiveService } from '../../../core/services/beehive.service';
import { HarvestService } from '../../../core/services/harvest.service';

interface HarvestForm {
  date: string;
  honey_type: HarvestType;
  honey_description: string;
  food_quantity: number | null;
  unit: HarvestUnit;
}

type NotificationType = 'error' | 'success' | 'warning';

@Component({
  selector: 'app-harvest',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './harvest.html',
  styleUrl: './harvest.scss',
})
export class HarvestComponent implements OnInit {
  private apiaryService = inject(ApiaryService);
  private beehiveService = inject(BeehiveService);
  private harvestService = inject(HarvestService);

  readonly HARVEST_TYPES = HARVEST_TYPES;
  readonly HARVEST_UNITS = HARVEST_UNITS;

  // Data
  apiaries = signal<Apiary[]>([]);
  beehives = signal<Beehive[]>([]);
  harvest = signal<Harvest[]>([]);

  // Selections
  selectedApiaryId = 0;
  selectedBeehiveId = 0;

  // Edit state
  editingId: number | null = null;
  editForm: HarvestForm = this.blank();

  // Add state
  showAddForm = false;
  newForm: HarvestForm = this.blank();

  // Notification
  notification: { type: NotificationType; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.apiaryService.getApiaries().subscribe(res => {
      if (res.success) this.apiaries.set(res.data);
    });
  }

  // ── Filter handlers ──────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId = apiaryId;
    this.selectedBeehiveId = 0;
    this.beehives.set([]);
    this.harvest.set([]);
    this.cancelEdit();
    this.cancelAdd();

    if (apiaryId !== 0) {
      this.beehiveService.getBeehivesOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.beehives.set(res.data);
      });
      this.harvestService.getHarvestOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.harvest.set(res.data);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    this.selectedBeehiveId = beehiveId;
    this.cancelEdit();
    this.cancelAdd();

    if (beehiveId !== 0) {
      this.harvestService.getHarvestOfBeehive(beehiveId).subscribe(res => {
        if (res.success) this.harvest.set(res.data);
      });
    } else if (this.selectedApiaryId !== 0) {
      this.harvestService.getHarvestOfApiary(this.selectedApiaryId).subscribe(res => {
        if (res.success) this.harvest.set(res.data);
      });
    }
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

    if (this.selectedBeehiveId !== 0) {
      const duplicate = this.harvest().some(h => h.date === this.newForm.date);
      if (duplicate) {
        const beehiveName = this.beehives().find(b => b.id === this.selectedBeehiveId)?.name ?? '';
        this.notify('warning',
          `A record for ${this.newForm.date} on beehive "${beehiveName}" already exists.`
        );
        return;
      }
    }

    const payload = {
      ...this.newForm,
      food_quantity: Number(this.newForm.food_quantity),
      honey_description: this.newForm.honey_type === 'honey' ? this.newForm.honey_description : '',
      ...(this.selectedBeehiveId !== 0
        ? { beehive_id: this.selectedBeehiveId }
        : { apiary_id: this.selectedApiaryId }),
    };

    this.harvestService.createHarvest(payload).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
          this.reloadData();
          this.notify('success', 'Record created successfully.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
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
          this.reloadData();
          this.notify('success', 'Record updated successfully.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  deleteRow(row: Harvest): void {
    if (this.selectedBeehiveId !== 0) {
      const beehiveName = row.beehive?.name ?? '';
      if (!confirm(`Delete harvest record for beehive "${beehiveName}" on ${row.date}?`)) return;

      this.harvestService.deleteHarvest(row.id).subscribe({
        next: res => {
          if (res.success) { this.reloadData(); this.notify('success', 'Record deleted.'); }
          else this.notify('error', 'Something went wrong. Please try again.');
        },
        error: () => this.notify('error', 'Something went wrong. Please try again.'),
      });
    } else {
      const apiaryName = this.apiaries().find(a => a.id === this.selectedApiaryId)?.name ?? '';
      if (!confirm(
        `Delete ALL harvest records for apiary "${apiaryName}" on ${row.date}?\nWARNING: This will delete records for all beehives of this apiary on that date!`
      )) return;

      this.harvestService.deleteHarvestByApiaryAndDate(this.selectedApiaryId, row.date).subscribe({
        next: res => {
          if (res.success) { this.reloadData(); this.notify('success', 'Records deleted.'); }
          else this.notify('error', 'Something went wrong. Please try again.');
        },
        error: () => this.notify('error', 'Something went wrong. Please try again.'),
      });
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  get canAdd(): boolean {
    return this.selectedApiaryId !== 0;
  }

  get canEdit(): boolean {
    return this.selectedBeehiveId !== 0;
  }

  clearNotification(): void {
    this.notification = null;
  }

  private notify(type: NotificationType, message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    if (type !== 'error') {
      this.notifTimer = setTimeout(() => (this.notification = null), 5000);
    }
  }

  private reloadData(): void {
    if (this.selectedBeehiveId !== 0) {
      this.harvestService.getHarvestOfBeehive(this.selectedBeehiveId).subscribe(res => {
        if (res.success) this.harvest.set(res.data);
      });
    } else if (this.selectedApiaryId !== 0) {
      this.harvestService.getHarvestOfApiary(this.selectedApiaryId).subscribe(res => {
        if (res.success) this.harvest.set(res.data);
      });
    }
  }

  private validate(form: HarvestForm): boolean {
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      this.notify('error', 'Date must be a valid date (yyyy-mm-dd).');
      return false;
    }
    if (form.food_quantity === null || isNaN(Number(form.food_quantity)) || Number(form.food_quantity) < 0) {
      this.notify('error', 'Quantity must be a valid positive number.');
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
