import { Component, inject, OnInit, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { of } from 'rxjs';
import { RequestService } from '../../../core/services/request.service';
import { DataTableComponent, ColumnDef } from '../../../shared/components/ui/data-table/data-table';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { AppErrorComponent } from '../../../shared/components/ui/app-error/app-error';
import { ModalService } from '../../../core/modal/modal.service';
import { FormModalComponent } from '../../../shared/components/ui/modal/form-modal/form-modal';
import { DynamicField } from '../../../core/models/form.model';
import { syncValidators } from '../../../shared/components/ui/form/validators.config';

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

interface CouponFormValue {
  code: string;
  type: 'percentage' | 'free_period';
  value: number | string;
  /** Absent when the type is a percentage — the field is disabled and left out of the value. */
  value_unit?: 'days' | 'months' | null;
  max_uses: number | string | null;
  expires_at: string | null;
  is_active: boolean;
}

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [SlicePipe, DataTableComponent, CardComponent, AppErrorComponent],
  templateUrl: './coupons.html',
})
export class CouponsComponent implements OnInit {
  private request = inject(RequestService);
  private modal = inject(ModalService);

  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly columns: ColumnDef[] = [
    { key: 'code', label: 'Code' },
    { key: 'type', label: 'Type' },
    { key: 'value', label: 'Value' },
    { key: 'uses', label: 'Uses' },
    { key: 'expires_at', label: 'Expires' },
    { key: 'is_usable', label: 'State' },
  ];

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading.set(true);
    this.error.set(null);
    this.request.getRequest<Coupon[]>('admin/coupons').subscribe({
      next: (res) => {
        this.coupons.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The coupon list did not load.');
        this.loading.set(false);
      },
    });
  }

  private fields(row: Coupon | null): DynamicField[] {
    return [
      { name: 'code', type: 'text', label: 'Code', size: 'full', placeholder: 'e.g. SUMMER20', value: row?.code ?? '', syncValidators: [syncValidators.required()] },
      {
        name: 'type', type: 'select', label: 'Type', size: 'half',
        value: row?.type ?? 'percentage',
        options: of([
          { displayValue: '% discount', returnValue: 'percentage' },
          { displayValue: 'Free period', returnValue: 'free_period' },
        ]),
        syncValidators: [syncValidators.required()],
      },
      { name: 'value', type: 'number', label: 'Value', size: 'half', value: row ? Number(row.value) : null, syncValidators: [syncValidators.required(), syncValidators.rangeNumber({ min: 0.01 })] },
      {
        name: 'value_unit', type: 'select', label: 'Unit', size: 'half',
        value: row?.value_unit ?? 'days',
        options: of([
          { displayValue: 'Days', returnValue: 'days' },
          { displayValue: 'Months', returnValue: 'months' },
        ]),
        // Only means anything for a free period; a disabled field is left out
        // of the submitted value, which is what the API expects.
        conditions: {
          disabled: [
            { triggerField: 'type', triggerValue: 'percentage', targetFields: ['value_unit'], action: 'disable' },
          ],
        },
      },
      { name: 'max_uses', type: 'number', label: 'Max uses (optional)', size: 'half', value: row?.max_uses ?? null, syncValidators: [syncValidators.rangeNumber({ min: 1 })] },
      { name: 'expires_at', type: 'date', label: 'Expires (optional)', size: 'half', value: row?.expires_at ?? '' },
      { name: 'is_active', type: 'toggle', label: 'Active', size: 'full', placeholder: 'An inactive coupon is rejected at checkout even before it expires.', value: row?.is_active ?? true },
    ];
  }

  private toPayload(value: CouponFormValue): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      code: value.code,
      type: value.type,
      value: Number(value.value),
      max_uses: value.max_uses === null || value.max_uses === '' ? null : Number(value.max_uses),
      expires_at: value.expires_at || null,
      is_active: !!value.is_active,
    };
    if (value.type === 'free_period') payload['value_unit'] = value.value_unit ?? 'days';
    return payload;
  }

  async openCreate(): Promise<void> {
    const result = await this.modal.open<CouponFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'New coupon', fields: this.fields(null), submitLabel: 'Create', cancelLabel: 'Cancel' },
    });
    if (!result) return;
    this.request.postRequest('admin/coupons', this.toPayload(result)).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  async openEdit(c: Coupon): Promise<void> {
    const result = await this.modal.open<CouponFormValue>(FormModalComponent, {
      type: 'center',
      data: { title: 'Edit coupon', fields: this.fields(c), submitLabel: 'Save', cancelLabel: 'Cancel' },
    });
    if (!result) return;
    this.request.putRequest(`admin/coupons/${c.id}`, this.toPayload(result)).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  toggle(id: number): void {
    this.request.postRequest(`admin/coupons/${id}/toggle`, {}).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  async deleteCoupon(c: Coupon): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete this coupon?',
      message: `${c.code} has been used ${c.used_count} time${c.used_count === 1 ? '' : 's'}. Deleting it does not reverse those redemptions.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    this.request.deleteRequest(`admin/coupons/${c.id}`).subscribe({
      next: () => this.loadCoupons(),
    });
  }

  formatValue(c: Coupon): string {
    if (c.type === 'percentage') return `${c.value}%`;
    return `${c.value} ${c.value_unit ?? 'days'}`;
  }
}
