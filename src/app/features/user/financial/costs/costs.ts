import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Cost } from '../../../../core/models/cost.model';
import { CostCategory } from '../../../../core/models/cost-category.model';
import { CostService } from '../../../../core/services/cost.service';
import { DataTableComponent, ColumnDef } from '../../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';

interface CostForm {
  date: string;
  name: string;
  category_id: number | null;
  amount: number | null;
}

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [FormsModule, DataTableComponent],
  templateUrl: './costs.html',
  styleUrl: './costs.scss',
})
export class CostsComponent implements OnInit {
  private costService = inject(CostService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly costCategories = input<CostCategory[]>([]);
  readonly costsChange = output<void>();

  readonly columns: ColumnDef[] = [
    { key: 'date', label: 'Date' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'amount', label: 'Amount' },
  ];

  costs = signal<Cost[]>([]);
  loading = signal(false);

  editingId: number | null = null;
  editForm: CostForm = this.blank();

  showAddForm = false;
  newForm: CostForm = this.blank();

  readonly categoryName = computed(() => {
    const map = new Map(this.costCategories().map(c => [c.id, c.name]));
    return (id: number) => map.get(id) ?? '—';
  });

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
    this.costService.createCost({
      date: this.newForm.date,
      name: this.newForm.name,
      category_id: this.newForm.category_id!,
      amount: Number(this.newForm.amount),
    }).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
          this.load();
          this.costsChange.emit();
          this.toast.success('Cost created.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  startEdit(row: Cost): void {
    this.cancelAdd();
    this.editingId = row.id;
    this.editForm = { date: row.date, name: row.name, category_id: row.category_id, amount: row.amount };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null || !this.validate(this.editForm)) return;
    this.costService.updateCost(this.editingId, {
      date: this.editForm.date,
      name: this.editForm.name,
      category_id: this.editForm.category_id!,
      amount: Number(this.editForm.amount),
    }).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.load();
          this.costsChange.emit();
          this.toast.success('Cost updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  async deleteRow(row: Cost): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Cost',
      message: `Delete cost "${row.name}" on ${row.date}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.costService.deleteCost(row.id).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.costsChange.emit();
          this.toast.success('Cost deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.costService.getCosts().subscribe(res => {
      if (res.success) this.costs.set(res.data);
      this.loading.set(false);
    });
  }

  private validate(form: CostForm): boolean {
    if (!form.date || isNaN(new Date(form.date).getTime())) {
      this.toast.error('A valid date is required.');
      return false;
    }
    if (!form.name.trim()) {
      this.toast.error('Name is required.');
      return false;
    }
    if (!form.category_id) {
      this.toast.error('Please select a category.');
      return false;
    }
    if (form.amount === null || isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      this.toast.error('Amount must be a valid positive number.');
      return false;
    }
    return true;
  }

  private blank(): CostForm {
    return {
      date: new Date().toISOString().split('T')[0],
      name: '',
      category_id: null,
      amount: null,
    };
  }
}
