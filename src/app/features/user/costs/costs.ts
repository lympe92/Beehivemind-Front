import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { of } from 'rxjs';
import { Cost } from '../../../core/models/cost.model';
import { CostCategory } from '../../../core/models/cost-category.model';
import { CostService } from '../../../core/services/cost.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';

@Component({
  selector: 'app-costs',
  standalone: true,
  imports: [DataTableComponent],
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

  readonly categoryName = computed(() => {
    const map = new Map(this.costCategories().map(c => [c.id, c.name]));
    return (id: number) => map.get(id) ?? '—';
  });

  ngOnInit(): void {
    this.load();
  }

  async startAdd(): Promise<void> {
    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '440px',
      data: {
        title: 'Add Cost',
        fields: [
          {
            name: 'date',
            type: 'date',
            label: 'Date',
            size: 'half',
            value: new Date().toISOString().split('T')[0],
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'name',
            type: 'text',
            label: 'Name',
            size: 'half',
            value: '',
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'category_id',
            type: 'select',
            label: 'Category',
            size: 'half',
            value: null,
            syncValidators: [syncValidators.required()],
            options: of(this.costCategories().map(cat => ({
              displayValue: cat.name,
              returnValue: cat.id,
            }))),
          },
          {
            name: 'amount',
            type: 'number',
            label: 'Amount',
            size: 'half',
            value: null,
            syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9_999_999 })],
          },
        ],
      },
    });
    if (!value) return;

    this.costService.createCost({
      date: value.date,
      name: value.name.trim(),
      category_id: Number(value.category_id),
      amount: Number(value.amount),
    }).subscribe({
      next: res => {
        if (res.success) {
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

  async startEdit(row: Cost): Promise<void> {
    const value = await this.modal.open<any>(FormModalComponent, {
      type: 'center',
      width: '440px',
      data: {
        title: 'Edit Cost',
        fields: [
          {
            name: 'date',
            type: 'date',
            label: 'Date',
            size: 'half',
            value: row.date,
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'name',
            type: 'text',
            label: 'Name',
            size: 'half',
            value: row.name,
            syncValidators: [syncValidators.required()],
          },
          {
            name: 'category_id',
            type: 'select',
            label: 'Category',
            size: 'half',
            value: row.category_id,
            syncValidators: [syncValidators.required()],
            options: of(this.costCategories().map(cat => ({
              displayValue: cat.name,
              returnValue: cat.id,
            }))),
          },
          {
            name: 'amount',
            type: 'number',
            label: 'Amount',
            size: 'half',
            value: row.amount,
            syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0, max: 9_999_999 })],
          },
        ],
      },
    });
    if (!value) return;

    this.costService.updateCost(row.id, {
      date: value.date,
      name: value.name.trim(),
      category_id: Number(value.category_id),
      amount: Number(value.amount),
    }).subscribe({
      next: res => {
        if (res.success) {
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
}
