import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Beehive } from '../../../core/models/beehive.model';
import { BeehiveService } from '../../../core/services/beehive.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';

interface BeehiveForm {
  name: string;
  queen_year: number | null;
}

type NotificationType = 'error' | 'success' | 'warning';

@Component({
  selector: 'app-beehives',
  standalone: true,
  imports: [FormsModule, FilterBarComponent],
  templateUrl: './beehives.html',
  styleUrl: './beehives.scss',
})
export class BeehivesComponent implements OnInit {
  private store = inject(Store);
  private beehiveService = inject(BeehiveService);

  // From store
  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);

  selectedApiaryId = signal<number>(0);

  beehives = computed(() => {
    const id = this.selectedApiaryId();
    return id === 0
      ? this.allBeehives()
      : this.allBeehives().filter(b => b.apiaryId === id);
  });

  beehivesToCreate: number | null = null;
  editingId: number | null = null;
  editForm: BeehiveForm = this.blank();
  notification: { type: NotificationType; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
  }

  // ── Apiary filter ─────────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    this.selectedApiaryId.set(apiaryId);
    this.cancelEdit();
    this.beehivesToCreate = null;
  }

  // ── Bulk create ──────────────────────────────────────────

  addBeehives(): void {
    const apiaryId = this.selectedApiaryId();
    if (apiaryId === 0) {
      this.notify('error', 'Select an apiary first.');
      return;
    }
    const count = Number(this.beehivesToCreate);
    if (!count || count < 1 || !Number.isInteger(count)) {
      this.notify('error', 'Enter a valid number of beehives to create (≥ 1).');
      return;
    }

    this.beehiveService.createBeehives(apiaryId, count).subscribe({
      next: res => {
        if (res.success) {
          this.beehivesToCreate = null;
          this.store.dispatch(BeehivesActions.reload());
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
          this.store.dispatch(BeehivesActions.reload());
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
          this.store.dispatch(BeehivesActions.reload());
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
