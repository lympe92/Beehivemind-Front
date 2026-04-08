import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RequestService } from '../../../core/services/request.service';
import {SlicePipe} from '@angular/common';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'free_period';
  value: string;
  value_unit: string | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  is_usable: boolean;
  created_at: string;
}

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [FormsModule, SlicePipe],
  templateUrl: './coupons.html',
  styleUrl: './coupons.scss',
})
export class CouponsComponent implements OnInit {
  private request = inject(RequestService);

  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showForm = signal(false);
  formMode = signal<'create' | 'edit'>('create');
  editingId = signal<number | null>(null);

  form = {
    code: '',
    type: 'percentage' as 'percentage' | 'free_period',
    value: '',
    value_unit: 'days' as 'days' | 'months',
    max_uses: '',
    expires_at: '',
    is_active: true,
  };

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading.set(true);
    this.request.getRequest<{ data: Coupon[] }>('admin/coupons').subscribe({
      next: (res) => {
        this.coupons.set(res.data.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load coupons');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.form = { code: '', type: 'percentage', value: '', value_unit: 'days', max_uses: '', expires_at: '', is_active: true };
    this.formMode.set('create');
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(c: Coupon): void {
    this.form = {
      code: c.code,
      type: c.type,
      value: c.value,
      value_unit: (c.value_unit as any) ?? 'days',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      expires_at: c.expires_at ? c.expires_at.slice(0, 16) : '',
      is_active: c.is_active,
    };
    this.formMode.set('edit');
    this.editingId.set(c.id);
    this.showForm.set(true);
  }

  submitForm(): void {
    const payload: any = {
      code: this.form.code,
      type: this.form.type,
      value: Number(this.form.value),
      max_uses: this.form.max_uses ? Number(this.form.max_uses) : null,
      expires_at: this.form.expires_at || null,
      is_active: this.form.is_active,
    };
    if (this.form.type === 'free_period') {
      payload.value_unit = this.form.value_unit;
    }

    const req = this.formMode() === 'create'
      ? this.request.postRequest('admin/coupons', payload)
      : this.request.putRequest(`admin/coupons/${this.editingId()}`, payload);

    req.subscribe({
      next: () => { this.showForm.set(false); this.loadCoupons(); },
    });
  }

  toggle(id: number): void {
    this.request.postRequest(`admin/coupons/${id}/toggle`, {}).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  deleteCoupon(id: number): void {
    if (!confirm('Delete this coupon?')) return;
    this.request.deleteRequest(`admin/coupons/${id}`).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  formatValue(c: Coupon): string {
    if (c.type === 'percentage') return `${c.value}%`;
    return `${c.value} ${c.value_unit}`;
  }
}
