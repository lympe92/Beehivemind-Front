import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { of } from 'rxjs';
import { RequestService } from '../../../../core/services/request.service';
import { FieldConfig, ModelConfig, RAW_MODELS } from '../raw-data.models';
import { DataTableComponent, ColumnDef, TablePagination } from '../../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../../shared/components/ui/app-error/app-error';
import { ModalService } from '../../../../core/modal/modal.service';
import { FormModalComponent } from '../../../../shared/components/ui/modal/form-modal/form-modal';
import { DynamicField } from '../../../../core/models/form.model';
import { syncValidators } from '../../../../shared/components/ui/form/validators.config';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';

type RawRow = Record<string, unknown>;

@Component({
  selector: 'app-raw-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './raw-list.html',
})
export class RawListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private request = inject(RequestService);
  private destroyRef = inject(DestroyRef);
  private modal = inject(ModalService);
  private toast = inject(ToastService);

  modelKey = signal('');
  config = computed<ModelConfig | null>(() => RAW_MODELS[this.modelKey()] ?? null);
  isTokens = computed(() => this.modelKey() === 'tokens');

  tableColumns = computed<ColumnDef[]>(() => {
    const cfg = this.config();
    return cfg ? cfg.displayColumns.map(k => ({ key: k, label: k.replace(/_/g, ' ') })) : [];
  });

  tablePagination = computed<TablePagination | null>(() => {
    const lp = this.lastPage();
    if (lp <= 1) return null;
    return { page: this.page(), totalPages: lp, total: this.total() };
  });

  rows = signal<RawRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  lastPage = signal(1);

  search = '';

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.modelKey.set(params.get('model') ?? '');
      this.page.set(1);
      this.search = '';
      this.loadData();
    });
  }

  loadData(): void {
    const cfg = this.config();
    if (!cfg) return;

    this.loading.set(true);
    this.error.set(null);
    const params = new URLSearchParams({ page: String(this.page()) });
    if (this.search) params.set('search', this.search);

    this.request
      .getRequest<RawRow[]>(`admin/raw/${cfg.endpoint}?${params}`)
      .subscribe({
        next: (res) => {
          this.rows.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.lastPage.set(res.meta?.total_pages ?? 1);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('The table did not load.');
          this.loading.set(false);
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadData();
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadData();
  }

  /** The registry entry becomes a field config; the form driver does the rest. */
  private fields(cfg: ModelConfig, row: RawRow | null): DynamicField[] {
    const source = row ? cfg.fields.filter(f => !f.createOnly) : cfg.fields;
    return source.map(f => this.toDynamicField(f, row));
  }

  private toDynamicField(f: FieldConfig, row: RawRow | null): DynamicField {
    const current = row ? row[f.key] : undefined;
    const validators = f.required ? [syncValidators.required()] : [];
    const base = { name: f.key, label: f.label, syncValidators: validators } as const;

    switch (f.type) {
      case 'select':
        return {
          ...base, type: 'select', size: 'half',
          value: current ?? null,
          options: of((f.options ?? []).map(o => ({ displayValue: o.label, returnValue: o.value }))),
        };
      case 'boolean':
        return { ...base, type: 'toggle', size: 'half', value: !!current };
      case 'textarea':
        return { ...base, type: 'textarea', size: 'full', value: (current as string) ?? '' };
      case 'number':
        return { ...base, type: 'number', size: 'half', value: current === undefined || current === null ? null : Number(current) };
      case 'date':
      case 'datetime':
        return { ...base, type: 'date', size: 'half', value: (current as string) ?? '' };
      case 'email':
        return { ...base, type: 'email', size: 'half', value: (current as string) ?? '', syncValidators: [...validators, syncValidators.email()] };
      case 'password':
        return { ...base, type: 'password', size: 'half', value: '' };
      default:
        return { ...base, type: 'text', size: 'half', value: (current as string) ?? '' };
    }
  }

  async openCreate(): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;
    const result = await this.modal.open<RawRow>(FormModalComponent, {
      type: 'center',
      data: {
        title: `New ${cfg.singularLabel.toLowerCase()}`,
        subtitle: 'This writes straight to the table.',
        fields: this.fields(cfg, null),
        submitLabel: 'Create',
        cancelLabel: 'Cancel',
      },
    });
    if (!result) return;
    this.request.postRequest(`admin/raw/${cfg.endpoint}`, result).subscribe({
      next: () => this.loadData(),
      error: (err) => this.toast.error(err?.error?.message ?? 'The row was not created.'),
    });
  }

  async openEdit(row: RawRow): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;
    const result = await this.modal.open<RawRow>(FormModalComponent, {
      type: 'center',
      data: {
        title: `Edit ${cfg.singularLabel.toLowerCase()}`,
        subtitle: 'This writes straight to the table.',
        fields: this.fields(cfg, row),
        submitLabel: 'Save',
        cancelLabel: 'Cancel',
      },
    });
    if (!result) return;
    this.request.putRequest(`admin/raw/${cfg.endpoint}/${row['id']}`, result).subscribe({
      next: () => this.loadData(),
      error: (err) => this.toast.error(err?.error?.message ?? 'The row was not saved.'),
    });
  }

  async confirmDelete(row: RawRow): Promise<void> {
    const cfg = this.config();
    if (!cfg) return;
    const tokens = this.isTokens();
    const confirmed = await this.modal.confirm({
      title: tokens ? 'Revoke this token?' : 'Delete this record?',
      message: tokens
        ? 'The device holding it is signed out immediately and will have to sign in again.'
        : 'This writes straight to the table. Nothing here checks what else points at this row.',
      confirmLabel: tokens ? 'Revoke' : 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    const id = row['id'];
    const req = tokens
      ? this.request.postRequest(`admin/raw/tokens/${id}/revoke`, {})
      : this.request.deleteRequest(`admin/raw/${cfg.endpoint}/${id}`);

    req.subscribe({ next: () => this.loadData() });
  }

  rawValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.join(', ');
    const str = String(value);
    return str.length > 40 ? str.slice(0, 40) + '…' : str;
  }
}
