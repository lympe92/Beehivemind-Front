import { Component, inject, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CostCategory, CostType } from '../../../../core/models/cost-category.model';
import { CostCategoryService } from '../../../../core/services/cost-category.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table';

interface CategoryForm {
  name: string;
  description: string;
  type: CostType;
}

@Component({
  selector: 'app-cost-categories',
  standalone: true,
  imports: [FormsModule, DataTableComponent],
  templateUrl: './cost-categories.html',
  styleUrl: './cost-categories.scss',
})
export class CostCategoriesComponent implements OnInit {
  private categoryService = inject(CostCategoryService);

  readonly categoriesChange = output<CostCategory[]>();

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
  ];

  categories = signal<CostCategory[]>([]);
  loading = signal(false);

  editingId: number | null = null;
  editForm: CategoryForm = this.blank();

  showAddForm = false;
  newForm: CategoryForm = this.blank();

  notification: { type: 'error' | 'success'; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

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
    this.categoryService.createCategory(this.newForm).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
          this.load();
          this.notify('success', 'Category created.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  startEdit(row: CostCategory): void {
    this.cancelAdd();
    this.editingId = row.id;
    this.editForm = { name: row.name, description: row.description, type: row.type };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null || !this.validate(this.editForm)) return;
    this.categoryService.updateCategory(this.editingId, this.editForm).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.load();
          this.notify('success', 'Category updated.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  deleteRow(row: CostCategory): void {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    this.categoryService.deleteCategory(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.notify('success', 'Category deleted.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  clearNotification(): void {
    this.notification = null;
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

  private validate(form: CategoryForm): boolean {
    if (!form.name.trim()) {
      this.notify('error', 'Name is required.');
      return false;
    }
    return true;
  }

  private notify(type: 'error' | 'success', message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    if (type === 'success') {
      this.notifTimer = setTimeout(() => (this.notification = null), 4000);
    }
  }

  private blank(): CategoryForm {
    return { name: '', description: '', type: 'income' };
  }
}