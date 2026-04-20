import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Apiary } from '../../../../../core/models/apiary.model';
import { Beehive } from '../../../../../core/models/beehive.model';
import { Inspection } from '../../../../../core/models/inspection.model';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface AddInspectionModalData {
  apiaries: Apiary[];
  allBeehives: Beehive[];
  preselectedApiaryId: number;
  preselectedBeehiveId: number;
  editRow?: Inspection;
}

export interface AddInspectionModalResult {
  beehive_id: number;
  date: string;
  frame_space: number;
  population: number;
  pollen: number;
  honey: number;
  opened_brood: number;
  closed_brood: number;
  varroa: 0 | 1;
  american_foulbrood: 0 | 1;
  european_foulbrood: 0 | 1;
  nosema: 0 | 1;
  queen_exists: 0 | 1;
  queen_cells: 0 | 1;
  queen_year: number | null;
}

@Component({
  selector: 'app-add-inspection-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './add-inspection-modal.html',
  styleUrl: './add-inspection-modal.scss',
})
export class AddInspectionModalComponent {
  private dialogRef = inject(DialogRef<AddInspectionModalResult>);
  readonly data = inject<AddInspectionModalData>(MODAL_DATA);

  readonly isEditMode = !!this.data.editRow;
  readonly title = this.isEditMode ? 'Edit Inspection' : 'Add Inspection';

  selectedApiaryId = signal<number>(this.data.preselectedApiaryId);
  selectedBeehiveId = signal<number>(
    this.isEditMode ? this.data.editRow!.beehiveId : this.data.preselectedBeehiveId
  );

  beehives = computed(() =>
    this.data.allBeehives.filter(b => b.apiaryId === this.selectedApiaryId())
  );

  date = this.data.editRow?.date ?? new Date().toISOString().split('T')[0];
  frame_space: number | null = this.data.editRow?.frame_space ?? null;
  population: number | null = this.data.editRow?.population ?? null;
  pollen: number | null = this.data.editRow?.pollen ?? null;
  honey: number | null = this.data.editRow?.honey ?? null;
  opened_brood: number | null = this.data.editRow?.opened_brood ?? null;
  closed_brood: number | null = this.data.editRow?.closed_brood ?? null;
  varroa = !!this.data.editRow?.varroa;
  american_foulbrood = !!this.data.editRow?.american_foulbrood;
  european_foulbrood = !!this.data.editRow?.european_foulbrood;
  nosema = !!this.data.editRow?.nosema;
  queen_exists = this.data.editRow ? !!this.data.editRow.queen_exists : true;
  queen_cells = !!this.data.editRow?.queen_cells;
  queen_year: number | null = this.data.editRow?.queen_year ?? null;

  error = signal<string | null>(null);

  onApiaryChange(id: number): void {
    this.selectedApiaryId.set(id);
    this.selectedBeehiveId.set(0);
  }

  save(): void {
    if (this.selectedBeehiveId() === 0) {
      this.error.set('Please select an apiary and a beehive.');
      return;
    }
    if (!this.date || isNaN(new Date(this.date).getTime())) {
      this.error.set('Date must be a valid date (yyyy-mm-dd).');
      return;
    }
    if (this.frame_space === null || !Number.isInteger(Number(this.frame_space)) || Number(this.frame_space) < 0) {
      this.error.set('Frames must be a non-negative integer.');
      return;
    }
    if (this.population === null || !Number.isInteger(Number(this.population)) || Number(this.population) < 0) {
      this.error.set('Population must be a non-negative integer.');
      return;
    }
    for (const [field, value] of [['pollen', this.pollen], ['honey', this.honey], ['opened_brood', this.opened_brood], ['closed_brood', this.closed_brood]] as const) {
      if (value === null || isNaN(Number(value)) || Number(value) < 0) {
        this.error.set(`${field.replace('_', ' ')} must be a valid non-negative number.`);
        return;
      }
    }
    if (this.queen_year !== null && this.queen_year !== undefined) {
      const yr = Number(this.queen_year);
      if (isNaN(yr) || yr < 2000) {
        this.error.set('Queen Year must be ≥ 2000, or leave it empty.');
        return;
      }
    }

    this.dialogRef.close({
      beehive_id: this.selectedBeehiveId(),
      date: this.date,
      frame_space: Number(this.frame_space) || 0,
      population: Number(this.population) || 0,
      pollen: Number(this.pollen) || 0,
      honey: Number(this.honey) || 0,
      opened_brood: Number(this.opened_brood) || 0,
      closed_brood: Number(this.closed_brood) || 0,
      varroa: this.varroa ? 1 : 0,
      american_foulbrood: this.american_foulbrood ? 1 : 0,
      european_foulbrood: this.european_foulbrood ? 1 : 0,
      nosema: this.nosema ? 1 : 0,
      queen_exists: this.queen_exists ? 1 : 0,
      queen_cells: this.queen_cells ? 1 : 0,
      queen_year: this.queen_year ? Number(this.queen_year) : null,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
