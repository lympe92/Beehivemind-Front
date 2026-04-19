import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Inspection } from '../../../core/models/inspection.model';
import { InspectionService } from '../../../core/services/inspection.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { InspectionsActions } from '../../../store/inspections/inspections.actions';
import { selectAllInspections } from '../../../store/inspections/inspections.selectors';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';

interface InspectionForm {
  date: string;
  frame_space: number | null;
  population: number | null;
  pollen: number | null;
  honey: number | null;
  opened_brood: number | null;
  closed_brood: number | null;
  varroa: boolean;
  american_foulbrood: boolean;
  european_foulbrood: boolean;
  nosema: boolean;
  queen_exists: boolean;
  queen_cells: boolean;
  queen_year: number | null;
}

type NotificationType = 'error' | 'success' | 'warning';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [FormsModule, DataTableComponent],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class InspectionsComponent implements OnInit {
  private store = inject(Store);
  private inspectionService = inject(InspectionService);

  readonly columns: ColumnDef[] = [
    { key: 'date', label: 'Date' },
    { key: 'frame_space', label: 'Frames' },
    { key: 'population', label: 'Population' },
    { key: 'pollen', label: 'Pollen' },
    { key: 'honey', label: 'Honey' },
    { key: 'opened_brood', label: 'Egg' },
    { key: 'closed_brood', label: 'Closed Brood' },
    { key: 'varroa', label: 'Varroa' },
    { key: 'american_foulbrood', label: 'AFB' },
    { key: 'european_foulbrood', label: 'EFB' },
    { key: 'nosema', label: 'Nosema' },
    { key: 'queen_exists', label: 'Queen Seen' },
    { key: 'queen_cells', label: 'Queen Cells' },
    { key: 'queen_year', label: 'Queen Year' },
  ];

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allInspections = this.store.selectSignal(selectAllInspections);

  beehives = computed(() =>
    this.allBeehives().filter(b => b.apiaryId === this.selectedApiaryId())
  );

  inspections = computed(() => {
    const all = this.allInspections();
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
  editForm: InspectionForm = this.blank();

  showAddForm = false;
  newForm: InspectionForm = this.blank();

  notification: { type: NotificationType; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(InspectionsActions.load());
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

    const duplicate = this.inspections().some(i => i.date === this.newForm.date);
    if (duplicate) {
      const beehiveName = this.allBeehives().find(b => b.id === this.selectedBeehiveId())?.name ?? '';
      this.notify('warning',
        `A record for ${this.newForm.date} on beehive "${beehiveName}" already exists.`
      );
      return;
    }

    this.inspectionService.createInspection({
      ...this.toPayload(this.newForm),
      beehive_id: this.selectedBeehiveId(),
    }).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
          this.store.dispatch(InspectionsActions.reload());
          this.notify('success', 'Record created successfully.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  startEdit(row: Inspection): void {
    this.cancelAdd();
    this.editingId = row.id;
    this.editForm = {
      date: row.date,
      frame_space: row.frame_space,
      population: row.population,
      pollen: row.pollen,
      honey: row.honey,
      opened_brood: row.opened_brood,
      closed_brood: row.closed_brood,
      varroa: !!row.varroa,
      american_foulbrood: !!row.american_foulbrood,
      european_foulbrood: !!row.european_foulbrood,
      nosema: !!row.nosema,
      queen_exists: !!row.queen_exists,
      queen_cells: !!row.queen_cells,
      queen_year: row.queen_year,
    };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null || !this.validate(this.editForm)) return;

    this.inspectionService.updateInspection(this.editingId, this.toPayload(this.editForm)).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.store.dispatch(InspectionsActions.reload());
          this.notify('success', 'Record updated successfully.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  deleteRow(row: Inspection): void {
    const beehiveName = this.allBeehives().find(b => b.id === this.selectedBeehiveId())?.name ?? '';
    if (!confirm(`Delete inspection for beehive "${beehiveName}" on ${row.date}?`)) return;

    this.inspectionService.deleteInspection(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(InspectionsActions.reload());
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
    return this.selectedBeehiveId() !== 0;
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

  private validate(form: InspectionForm): boolean {
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      this.notify('error', 'Date must be a valid date (yyyy-mm-dd).');
      return false;
    }
    if (form.frame_space === null || isNaN(Number(form.frame_space)) || !Number.isInteger(Number(form.frame_space)) || Number(form.frame_space) < 0) {
      this.notify('error', 'Frames must be a non-negative integer.');
      return false;
    }
    if (form.population === null || isNaN(Number(form.population)) || !Number.isInteger(Number(form.population)) || Number(form.population) < 0) {
      this.notify('error', 'Population must be a non-negative integer.');
      return false;
    }
    for (const field of ['pollen', 'honey', 'opened_brood', 'closed_brood'] as const) {
      if (form[field] === null || isNaN(Number(form[field])) || Number(form[field]) < 0) {
        this.notify('error', `${field.replace('_', ' ')} must be a valid non-negative number.`);
        return false;
      }
    }
    if (form.queen_year !== null && form.queen_year !== undefined) {
      const yr = Number(form.queen_year);
      if (isNaN(yr) || yr < 2000) {
        this.notify('error', 'Queen Year must be a number ≥ 2000, or leave it empty.');
        return false;
      }
    }
    return true;
  }

  private toPayload(form: InspectionForm) {
    return {
      date: form.date,
      frame_space: Number(form.frame_space) || 0,
      population: Number(form.population) || 0,
      pollen: Number(form.pollen) || 0,
      honey: Number(form.honey) || 0,
      opened_brood: Number(form.opened_brood) || 0,
      closed_brood: Number(form.closed_brood) || 0,
      varroa: form.varroa ? 1 : 0,
      american_foulbrood: form.american_foulbrood ? 1 : 0,
      european_foulbrood: form.european_foulbrood ? 1 : 0,
      nosema: form.nosema ? 1 : 0,
      queen_exists: form.queen_exists ? 1 : 0,
      queen_cells: form.queen_cells ? 1 : 0,
      queen_year: form.queen_year ? Number(form.queen_year) : null,
    } as Omit<Inspection, 'id' | 'beehiveId'>;
  }

  private blank(): InspectionForm {
    return {
      date: new Date().toISOString().split('T')[0],
      frame_space: null,
      population: null,
      pollen: null,
      honey: null,
      opened_brood: null,
      closed_brood: null,
      varroa: false,
      american_foulbrood: false,
      european_foulbrood: false,
      nosema: false,
      queen_exists: true,
      queen_cells: false,
      queen_year: null,
    };
  }
}
