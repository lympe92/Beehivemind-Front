import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../core/models/apiary.model';
import { Beehive } from '../../../core/models/beehive.model';
import {
  Feeding,
  FEEDING_TYPES,
  FOOD_TYPES,
  FEEDING_UNITS,
  FeedingType,
  FoodType,
  FeedingUnit,
} from '../../../core/models/feeding.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { BeehiveService } from '../../../core/services/beehive.service';
import { FeedingService } from '../../../core/services/feeding.service';

interface FeedingForm {
  date: string;
  feeding_type: FeedingType;
  food_type: FoodType;
  food_quantity: number | null;
  unit: FeedingUnit;
}

type NotificationType = 'error' | 'success' | 'warning';

interface Notification {
  type: NotificationType;
  message: string;
}

@Component({
  selector: 'app-feeding',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './feeding.html',
  styleUrl: './feeding.scss',
})
export class FeedingComponent implements OnInit {
  private apiaryService = inject(ApiaryService);
  private beehiveService = inject(BeehiveService);
  private feedingService = inject(FeedingService);

  readonly FEEDING_TYPES = FEEDING_TYPES;
  readonly FOOD_TYPES = FOOD_TYPES;
  readonly FEEDING_UNITS = FEEDING_UNITS;

  // Data
  apiaries = signal<Apiary[]>([]);
  beehives = signal<Beehive[]>([]);
  feeding = signal<Feeding[]>([]);

  // Selections
  selectedApiaryId = 0;
  selectedBeehiveId = 0;

  // Edit state
  editingId: number | null = null;
  editForm: FeedingForm = this.blankForm();

  // Add state
  showAddForm = false;
  newForm: FeedingForm = this.blankForm();

  // Notification
  notification: Notification | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ────────────────────────────────────────────

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
    this.feeding.set([]);
    this.cancelEdit();
    this.cancelAdd();

    if (apiaryId !== 0) {
      this.beehiveService.getBeehivesOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.beehives.set(res.data);
      });
      this.feedingService.getFeedingOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.feeding.set(res.data);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    this.selectedBeehiveId = beehiveId;
    this.cancelEdit();
    this.cancelAdd();

    if (beehiveId !== 0) {
      this.feedingService.getFeedingOfBeehive(beehiveId).subscribe(res => {
        if (res.success) this.feeding.set(res.data);
      });
    } else if (this.selectedApiaryId !== 0) {
      this.feedingService.getFeedingOfApiary(this.selectedApiaryId).subscribe(res => {
        if (res.success) this.feeding.set(res.data);
      });
    }
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

    // Duplicate date check per beehive
    if (this.selectedBeehiveId !== 0) {
      const duplicate = this.feeding().some(f => f.date === this.newForm.date);
      if (duplicate) {
        const beehiveName = this.beehives().find(b => b.id === this.selectedBeehiveId)?.name ?? '';
        this.notify('warning',
          `A record for ${this.newForm.date}${beehiveName ? ` on beehive "${beehiveName}"` : ''} already exists. Edit that record instead.`
        );
        return;
      }
    }

    const payload = {
      ...this.newForm,
      food_quantity: Number(this.newForm.food_quantity),
      ...(this.selectedBeehiveId !== 0
        ? { beehive_id: this.selectedBeehiveId }
        : { apiary_id: this.selectedApiaryId }),
    };

    this.feedingService.createFeeding(payload).subscribe({
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

  deleteRow(row: Feeding): void {
    const beehiveName = row.beehive?.name ?? '';
    const confirmed = confirm(
      `Delete feeding record for${beehiveName ? ` beehive "${beehiveName}"` : ''} on ${row.date}?`
    );
    if (!confirmed) return;

    this.feedingService.deleteFeeding(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.reloadData();
          this.notify('success', 'Record deleted.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
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
      this.feedingService.getFeedingOfBeehive(this.selectedBeehiveId).subscribe(res => {
        if (res.success) this.feeding.set(res.data);
      });
    } else if (this.selectedApiaryId !== 0) {
      this.feedingService.getFeedingOfApiary(this.selectedApiaryId).subscribe(res => {
        if (res.success) this.feeding.set(res.data);
      });
    }
  }

  private validateForm(form: FeedingForm): boolean {
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
