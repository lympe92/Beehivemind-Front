import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { CostCategory, CostType } from '../../../../../core/models/cost-category.model';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { ModalShellComponent } from '../modal-shell/modal-shell';

export interface AddCostCategoryModalData {
  editRow?: CostCategory;
}

export interface AddCostCategoryModalResult {
  name: string;
  description: string;
  type: CostType;
}

@Component({
  selector: 'app-add-cost-category-modal',
  standalone: true,
  imports: [FormsModule, ModalShellComponent],
  templateUrl: './add-cost-category-modal.html',
  styleUrl: './add-cost-category-modal.scss',
})
export class AddCostCategoryModalComponent {
  private dialogRef = inject(DialogRef<AddCostCategoryModalResult>);
  readonly data = inject<AddCostCategoryModalData>(MODAL_DATA, { optional: true });

  readonly isEditMode = !!this.data?.editRow;
  readonly title = this.isEditMode ? 'Edit Cost Category' : 'Add Cost Category';

  name = this.data?.editRow?.name ?? '';
  description = this.data?.editRow?.description ?? '';
  type: CostType = this.data?.editRow?.type ?? 'income';

  error = signal<string | null>(null);

  save(): void {
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    this.dialogRef.close({ name: this.name.trim(), description: this.description.trim(), type: this.type });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
