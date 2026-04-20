import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { Cost } from '../../../core/models/cost.model';
import { CostCategory } from '../../../core/models/cost-category.model';
import { CostService } from '../../../core/services/cost.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import {
  AddCostModalComponent,
  AddCostModalData,
  AddCostModalResult,
} from '../../../shared/components/ui/modal/add-cost-modal/add-cost-modal';

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
    const result = await this.modal.open<AddCostModalResult, AddCostModalData>(
      AddCostModalComponent,
      {
        type: 'center',
        width: '440px',
        data: { costCategories: this.costCategories() },
      },
    );
    if (!result) return;

    this.costService.createCost(result).subscribe({
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
    const result = await this.modal.open<AddCostModalResult, AddCostModalData>(
      AddCostModalComponent,
      {
        type: 'center',
        width: '440px',
        data: { costCategories: this.costCategories(), editRow: row },
      },
    );
    if (!result) return;

    this.costService.updateCost(row.id, result).subscribe({
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
