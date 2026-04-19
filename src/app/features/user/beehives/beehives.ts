import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Beehive } from '../../../core/models/beehive.model';
import { BeehiveService } from '../../../core/services/beehive.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives, selectBeehivesLoading } from '../../../store/beehives/beehives.selectors';
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';

interface BeehiveForm {
  name: string;
  queen_year: number | null;
}

@Component({
  selector: 'app-beehives',
  standalone: true,
  imports: [FormsModule, FilterBarComponent, DataTableComponent, CardComponent],
  templateUrl: './beehives.html',
  styleUrl: './beehives.scss',
})
export class BeehivesComponent implements OnInit {
  private store = inject(Store);
  private beehiveService = inject(BeehiveService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  loading = this.store.selectSignal(selectBeehivesLoading);

  selectedApiaryId = signal<number>(0);

  beehives = computed(() => {
    const id = this.selectedApiaryId();
    return id === 0
      ? this.allBeehives()
      : this.allBeehives().filter(b => b.apiaryId === id);
  });

  readonly columns: ColumnDef[] = [
    { key: '_idx', label: '#', width: '48px' },
    { key: 'name', label: 'Name' },
    { key: 'queen_year', label: 'Queen Year' },
  ];

  beehivesToCreate: number | null = null;
  editingId: number | null = null;
  editForm: BeehiveForm = this.blank();

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
      this.toast.error('Select an apiary first.');
      return;
    }
    const count = Number(this.beehivesToCreate);
    if (!count || count < 1 || !Number.isInteger(count)) {
      this.toast.error('Enter a valid number of beehives to create (≥ 1).');
      return;
    }

    this.beehiveService.createBeehives(apiaryId, count).subscribe({
      next: res => {
        if (res.success) {
          this.beehivesToCreate = null;
          this.store.dispatch(BeehivesActions.reload());
          this.toast.success(`${count} beehive(s) created.`);
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  startEdit(row: Beehive): void {
    this.editingId = row.id;
    this.editForm = { name: row.name, queen_year: row.queen?.year ?? null };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null) return;
    if (!this.editForm.name?.trim()) {
      this.toast.error('Beehive name is required.');
      return;
    }
    if (this.editForm.queen_year !== null && this.editForm.queen_year !== undefined) {
      const yr = Number(this.editForm.queen_year);
      if (isNaN(yr) || yr < 2000) {
        this.toast.error('Queen year must be ≥ 2000, or leave it empty.');
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
          this.toast.success('Beehive updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(row: Beehive): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Beehive',
      message: `Delete "${row.name}"? All inspection and feeding data will be lost.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.beehiveService.deleteBeehive(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(BeehivesActions.reload());
          this.toast.success('Beehive deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  private blank(): BeehiveForm {
    return { name: '', queen_year: null };
  }
}
