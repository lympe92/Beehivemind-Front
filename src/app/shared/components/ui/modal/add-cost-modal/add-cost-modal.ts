import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { Cost } from '../../../../../core/models/cost.model';
import { CostCategory } from '../../../../../core/models/cost-category.model';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface AddCostModalData {
  costCategories: CostCategory[];
  editRow?: Cost;
}

export interface AddCostModalResult {
  date: string;
  name: string;
  category_id: number;
  amount: number;
}

@Component({
  selector: 'app-add-cost-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './add-cost-modal.html',
  styleUrl: './add-cost-modal.scss',
})
export class AddCostModalComponent {
  private dialogRef = inject(DialogRef<AddCostModalResult>);
  readonly data = inject<AddCostModalData>(MODAL_DATA);

  readonly isEditMode = !!this.data.editRow;
  readonly title = this.isEditMode ? 'Edit Cost' : 'Add Cost';

  date = this.data.editRow?.date ?? new Date().toISOString().split('T')[0];
  name = this.data.editRow?.name ?? '';
  category_id: number | null = this.data.editRow?.category_id ?? null;
  amount: number | null = this.data.editRow?.amount ?? null;

  error = signal<string | null>(null);

  save(): void {
    if (!this.date || isNaN(new Date(this.date).getTime())) {
      this.error.set('A valid date is required.');
      return;
    }
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    if (!this.category_id) {
      this.error.set('Please select a category.');
      return;
    }
    if (this.amount === null || isNaN(Number(this.amount)) || Number(this.amount) < 0) {
      this.error.set('Amount must be a valid positive number.');
      return;
    }
    this.dialogRef.close({
      date: this.date,
      name: this.name.trim(),
      category_id: this.category_id,
      amount: Number(this.amount),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
