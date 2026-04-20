import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Apiary } from '../../../../../core/models/apiary.model';
import { Beehive } from '../../../../../core/models/beehive.model';
import {
  Harvest,
  HARVEST_TYPES,
  HARVEST_UNITS,
  HarvestType,
  HarvestUnit,
} from '../../../../../core/models/harvest.model';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface AddHarvestModalData {
  apiaries: Apiary[];
  allBeehives: Beehive[];
  preselectedApiaryId: number;
  preselectedBeehiveId: number;
  editRow?: Harvest;
}

export interface AddHarvestModalResult {
  beehive_id?: number;
  apiary_id?: number;
  date: string;
  honey_type: HarvestType;
  honey_description: string;
  food_quantity: number;
  unit: HarvestUnit;
}

@Component({
  selector: 'app-add-harvest-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './add-harvest-modal.html',
  styleUrl: './add-harvest-modal.scss',
})
export class AddHarvestModalComponent {
  private dialogRef = inject(DialogRef<AddHarvestModalResult>);
  readonly data = inject<AddHarvestModalData>(MODAL_DATA);

  readonly HARVEST_TYPES = HARVEST_TYPES;
  readonly HARVEST_UNITS = HARVEST_UNITS;

  readonly isEditMode = !!this.data.editRow;
  readonly title = this.isEditMode ? 'Edit Harvest Record' : 'Add Harvest Record';

  selectedApiaryId = signal<number>(this.data.preselectedApiaryId);
  selectedBeehiveId = signal<number>(
    this.isEditMode ? this.data.editRow!.beehiveId : this.data.preselectedBeehiveId
  );

  beehives = computed(() =>
    this.data.allBeehives.filter(b => b.apiaryId === this.selectedApiaryId())
  );

  date = this.data.editRow?.date ?? new Date().toISOString().split('T')[0];
  honey_type: HarvestType = this.data.editRow?.honey_type ?? 'honey';
  honey_description = this.data.editRow?.honey_description ?? '';
  food_quantity: number | null = this.data.editRow?.food_quantity ?? null;
  unit: HarvestUnit = this.data.editRow?.unit ?? 'kg';

  error = signal<string | null>(null);

  onApiaryChange(id: number): void {
    this.selectedApiaryId.set(id);
    this.selectedBeehiveId.set(0);
  }

  save(): void {
    if (!this.isEditMode && this.selectedApiaryId() === 0) {
      this.error.set('Please select an apiary.');
      return;
    }
    if (!this.date || isNaN(new Date(this.date).getTime())) {
      this.error.set('Date must be a valid date (yyyy-mm-dd).');
      return;
    }
    if (this.food_quantity === null || isNaN(Number(this.food_quantity)) || Number(this.food_quantity) < 0) {
      this.error.set('Quantity must be a valid positive number.');
      return;
    }

    const result: AddHarvestModalResult = {
      date: this.date,
      honey_type: this.honey_type,
      honey_description: this.honey_type === 'honey' ? this.honey_description : '',
      food_quantity: Number(this.food_quantity),
      unit: this.unit,
    };

    if (this.isEditMode) {
      result.beehive_id = this.data.editRow!.beehiveId;
    } else if (this.selectedBeehiveId() !== 0) {
      result.beehive_id = this.selectedBeehiveId();
    } else {
      result.apiary_id = this.selectedApiaryId();
    }

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
