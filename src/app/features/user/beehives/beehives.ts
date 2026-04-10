import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../core/models/apiary.model';
import { Beehive } from '../../../core/models/beehive.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { BeehiveService } from '../../../core/services/beehive.service';

interface BeehiveForm {
  name: string;
  queen_year: number | null;
}

type NotificationType = 'error' | 'success' | 'warning';

@Component({
  selector: 'app-beehives',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './beehives.html',
  styleUrl: './beehives.scss',
})
export class BeehivesComponent implements OnInit {
  private apiaryService = inject(ApiaryService);
  private beehiveService = inject(BeehiveService);

  // Data
  apiaries = signal<Apiary[]>([]);
  beehives = signal<Beehive[]>([]);

  // Selections
  selectedApiaryId = 0;

  // Bulk create
  beehivesToCreate: number | null = null;

  // Edit state
  editingId: number | null = null;
  editForm: BeehiveForm = this.blank();

  // Notification
  notification: { type: NotificationType; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.apiaryService.getApiaries().subscribe(res => {
      if (res.success) this.apiaries.set(res.data);
    });
  }

  // ── Apiary change ────────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId = apiaryId;
    this.beehives.set([]);
    this.cancelEdit();
    this.beehivesToCreate = null;

    if (apiaryId !== 0) {
      this.loadBeehives();
    }
  }

  // ── Bulk create ──────────────────────────────────────────

  addBeehives(): void {
    const count = Number(this.beehivesToCreate);
    if (!count || count < 1 || !Number.isInteger(count)) {
      this.notify('error', 'Enter a valid number of beehives to create (≥ 1).');
      return;
    }

    this.beehiveService.createBeehives(this.selectedApiaryId, count).subscribe({
      next: res => {
        if (res.success) {
          this.beehivesToCreate = null;
          this.loadBeehives();
          this.notify('success', `${count} beehive(s) created.`);
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  startEdit(row: Beehive): void {
    this.editingId = row.id;
    this.editForm = {
      name: row.name,
      queen_year: row.queen?.year ?? null,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null) return;
    if (!this.editForm.name?.trim()) {
      this.notify('error', 'Beehive name is required.');
      return;
    }
    if (this.editForm.queen_year !== null && this.editForm.queen_year !== undefined) {
      const yr = Number(this.editForm.queen_year);
      if (isNaN(yr) || yr < 2000) {
        this.notify('error', 'Queen year must be ≥ 2000, or leave it empty.');
        return;
      }
    }

    const payload: Partial<Beehive> = {
      name: this.editForm.name.trim(),
      queen: this.editForm.queen_year ? { year: Number(this.editForm.queen_year) } : null,
    };

    this.beehiveService.updateBeehive(this.editingId, payload).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.loadBeehives();
          this.notify('success', 'Beehive updated.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  deleteRow(row: Beehive): void {
    if (!confirm(`Delete beehive "${row.name}"? All inspection and feeding data will be lost!`)) return;

    this.beehiveService.deleteBeehive(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.loadBeehives();
          this.notify('success', 'Beehive deleted.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  clearNotification(): void {
    this.notification = null;
  }

  private loadBeehives(): void {
    this.beehiveService.getBeehivesOfApiary(this.selectedApiaryId).subscribe(res => {
      if (res.success) this.beehives.set(res.data);
    });
  }

  private notify(type: NotificationType, message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    if (type !== 'error') {
      this.notifTimer = setTimeout(() => (this.notification = null), 5000);
    }
  }

  private blank(): BeehiveForm {
    return { name: '', queen_year: null };
  }
}
