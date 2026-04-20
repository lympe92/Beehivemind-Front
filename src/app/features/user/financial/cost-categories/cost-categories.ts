import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CostCategory } from '../../../../core/models/cost-category.model';
import { CostCategoryService } from '../../../../core/services/cost-category.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';
import {
  AddCostCategoryModalComponent,
  AddCostCategoryModalData,
  AddCostCategoryModalResult,
} from '../../../../shared/components/ui/modal/add-cost-category-modal/add-cost-category-modal';

@Component({
  selector: 'app-cost-categories',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './cost-categories.html',
  styleUrl: './cost-categories.scss',
})
export class CostCategoriesComponent implements OnInit {
  private categoryService = inject(CostCategoryService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly categoriesChange = output<CostCategory[]>();

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
  ];

  categories = signal<CostCategory[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  async startAdd(): Promise<void> {
    const result = await this.modal.open<AddCostCategoryModalResult>(
      AddCostCategoryModalComponent,
      { type: 'center', width: '440px' },
    );
    if (!result) return;

    this.categoryService.createCategory(result).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.toast.success('Category created.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  async startEdit(row: CostCategory): Promise<void> {
    const result = await this.modal.open<AddCostCategoryModalResult, AddCostCategoryModalData>(
      AddCostCategoryModalComponent,
      {
        type: 'center',
        width: '440px',
        data: { editRow: row },
      },
    );
    if (!result) return;

    this.categoryService.updateCategory(row.id, result).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.toast.success('Category updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  async deleteRow(row: CostCategory): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Category',
      message: `Delete category "${row.name}"?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.categoryService.deleteCategory(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.toast.success('Category deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe(res => {
      if (res.success) {
        this.categories.set(res.data);
        this.categoriesChange.emit(res.data);
      }
      this.loading.set(false);
    });
  }
}
