import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Apiary } from '../../../../../core/models/apiary.model';
import { Beehive } from '../../../../../core/models/beehive.model';
import {
  Feeding,
  FEEDING_TYPES,
  FOOD_TYPES,
  FEEDING_UNITS,
  FeedingType,
  FoodType,
  FeedingUnit,
} from '../../../../../core/models/feeding.model';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface AddFeedingModalData {
  apiaries: Apiary[];
  allBeehives: Beehive[];
  preselectedApiaryId: number;
  preselectedBeehiveId: number;
  editRow?: Feeding;
}

export interface AddFeedingModalResult {
  beehive_id?: number;
  apiary_id?: number;
  date: string;
  feeding_type: FeedingType;
  food_type: FoodType;
  food_quantity: number;
  unit: FeedingUnit;
}

@Component({
  selector: 'app-add-feeding-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './add-feeding-modal.html',
  styleUrl: './add-feeding-modal.scss',
})
export class AddFeedingModalComponent {
  private dialogRef = inject(DialogRef<AddFeedingModalResult>);
  readonly data = inject<AddFeedingModalData>(MODAL_DATA);

  readonly FEEDING_TYPES = FEEDING_TYPES;
  readonly FOOD_TYPES = FOOD_TYPES;
  readonly FEEDING_UNITS = FEEDING_UNITS;

  readonly isEditMode = !!this.data.editRow;
  readonly title = this.isEditMode ? 'Edit Feeding Record' : 'Add Feeding Record';

  selectedApiaryId = signal<number>(this.data.preselectedApiaryId);
  selectedBeehiveId = signal<number>(
    this.isEditMode ? this.data.editRow!.beehiveId : this.data.preselectedBeehiveId
  );

  beehives = computed(() =>
    this.data.allBeehives.filter(b => b.apiaryId === this.selectedApiaryId())
  );

  date = this.data.editRow?.date ?? new Date().toISOString().split('T')[0];
  feeding_type: FeedingType = this.data.editRow?.feeding_type ?? 'stimulation';
  food_type: FoodType = this.data.editRow?.food_type ?? 'sugar syrup';
  food_quantity: number | null = this.data.editRow?.food_quantity ?? null;
  unit: FeedingUnit = this.data.editRow?.unit ?? 'kg';

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

    const result: AddFeedingModalResult = {
      date: this.date,
      feeding_type: this.feeding_type,
      food_type: this.food_type,
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
