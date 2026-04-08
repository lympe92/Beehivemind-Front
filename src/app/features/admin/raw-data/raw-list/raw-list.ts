import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../../../core/services/request.service';
import { ModelConfig, RAW_MODELS } from '../raw-data.models';

@Component({
  selector: 'app-raw-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './raw-list.html',
  styleUrl: './raw-list.scss',
})
export class RawListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private request = inject(RequestService);

  modelKey = signal('');
  config = computed<ModelConfig | null>(() => RAW_MODELS[this.modelKey()] ?? null);
  visibleFields = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];
    return this.isEditing()
      ? cfg.fields.filter((f) => !f.createOnly)
      : cfg.fields;
  });

  rows = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  total = signal(0);
  page = signal(1);
  lastPage = signal(1);

  search = '';

  showModal = signal(false);
  isEditing = signal(false);
  editingId = signal<number | null>(null);
  formData = signal<Record<string, any>>({});
  formError = signal<string | null>(null);
  formLoading = signal(false);

  deleteConfirmId = signal<number | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
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
    const params = new URLSearchParams({ page: String(this.page()) });
    if (this.search) params.set('search', this.search);

    this.request.getRequest<any>(`admin/raw/${cfg.endpoint}?${params}`).subscribe({
      next: (res) => {
        const paginated = res.data;
        this.rows.set(paginated.data ?? []);
        this.total.set(paginated.total ?? 0);
        this.lastPage.set(paginated.last_page ?? 1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load data');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadData();
  }

  prevPage(): void {
    if (this.page() > 1) { this.page.update((p) => p - 1); this.loadData(); }
  }

  nextPage(): void {
    if (this.page() < this.lastPage()) { this.page.update((p) => p + 1); this.loadData(); }
  }

  openCreate(): void {
    const cfg = this.config();
    if (!cfg) return;
    const initial: Record<string, any> = {};
    cfg.fields.forEach((f) => { initial[f.key] = f.type === 'boolean' ? false : ''; });
    this.formData.set(initial);
    this.isEditing.set(false);
    this.editingId.set(null);
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(row: any): void {
    const cfg = this.config();
    if (!cfg) return;
    const data: Record<string, any> = {};
    cfg.fields.filter((f) => !f.createOnly).forEach((f) => { data[f.key] = row[f.key] ?? ''; });
    this.formData.set(data);
    this.isEditing.set(true);
    this.editingId.set(row.id);
    this.formError.set(null);
    this.showModal.set(true);
  }

  getField(key: string): any { return this.formData()[key]; }

  setField(key: string, value: any): void {
    this.formData.update((d) => ({ ...d, [key]: value }));
  }

  submitForm(): void {
    const cfg = this.config();
    if (!cfg) return;
    this.formLoading.set(true);
    this.formError.set(null);

    const data = this.formData();
    const req = this.isEditing()
      ? this.request.putRequest(`admin/raw/${cfg.endpoint}/${this.editingId()}`, data)
      : this.request.postRequest(`admin/raw/${cfg.endpoint}`, data);

    req.subscribe({
      next: () => {
        this.formLoading.set(false);
        this.showModal.set(false);
        this.loadData();
      },
      error: (err) => {
        this.formLoading.set(false);
        this.formError.set(err?.error?.message ?? 'Operation failed');
      },
    });
  }

  confirmDelete(id: number): void { this.deleteConfirmId.set(id); }
  cancelDelete(): void { this.deleteConfirmId.set(null); }

  doDelete(): void {
    const cfg = this.config();
    const id = this.deleteConfirmId();
    if (!cfg || id === null) return;

    // Tokens use revoke endpoint
    const isToken = this.modelKey() === 'tokens';
    const req = isToken
      ? this.request.postRequest(`admin/raw/tokens/${id}/revoke`, {})
      : this.request.deleteRequest(`admin/raw/${cfg.endpoint}/${id}`);

    req.subscribe({
      next: () => { this.deleteConfirmId.set(null); this.loadData(); },
    });
  }

  formatCell(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (Array.isArray(value)) return value.join(', ');
    const str = String(value);
    return str.length > 40 ? str.slice(0, 40) + '…' : str;
  }
}
