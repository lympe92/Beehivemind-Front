import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Apiary } from '../../../core/models/apiary.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries, selectApiariesLoading } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { DataTableComponent, ColumnDef, TablePagination } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { ApiaryFormModalComponent } from '../../../shared/components/ui/modal/apiary-form-modal/apiary-form-modal';

@Component({
  selector: 'app-apiary',
  standalone: true,
  imports: [DatePipe, RouterLink, DataTableComponent, CardComponent],
  templateUrl: './apiary.html',
  styleUrl: './apiary.scss',
})
export class ApiaryComponent implements OnInit {
  private store = inject(Store);
  private apiaryService = inject(ApiaryService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly columns: ColumnDef[] = [
    { key: 'name',            label: 'Name' },
    { key: 'hivesNumber',     label: 'Hives',       width: '70px' },
    { key: 'location',        label: 'Location' },
    { key: 'dateEstablished', label: 'Established', width: '110px' },
  ];

  page = signal(1);
  readonly perPage = 10;

  private allApiaries = this.store.selectSignal(selectAllApiaries);
  loading = this.store.selectSignal(selectApiariesLoading);

  apiaries = computed(() => {
    const start = (this.page() - 1) * this.perPage;
    return this.allApiaries().slice(start, start + this.perPage);
  });

  meta = computed(() => {
    const total = this.allApiaries().length;
    return {
      total,
      total_pages: Math.ceil(total / this.perPage) || 1,
      page: this.page(),
      per_page: this.perPage,
    };
  });

  get tablePagination(): TablePagination | null {
    const m = this.meta();
    if (m.total_pages <= 1) return null;
    return { page: this.page(), totalPages: m.total_pages, total: m.total };
  }

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
  }

  // ── Add ──────────────────────────────────────────────────

  async startAdd(): Promise<void> {
    const existingNames = this.allApiaries().map(a => a.name);

    const value = await this.modal.open<any>(ApiaryFormModalComponent, {
      type: 'center',
      width: '640px',
      data: {},
    });

    if (!value) return;

    if (existingNames.includes(value.name.trim())) {
      this.toast.warning(`An apiary named "${value.name.trim()}" already exists.`);
      return;
    }

    this.apiaryService.createApiary({
      name: value.name.trim(),
      hivesNumber: Number(value.hivesNumber) || 0,
      latitude: value.latitude,
      longitude: value.longitude,
      location: value.location || null,
      dateEstablished: value.dateEstablished || null,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary created.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  async startEdit(apiary: Apiary): Promise<void> {
    const value = await this.modal.open<any>(ApiaryFormModalComponent, {
      type: 'center',
      width: '640px',
      data: { apiary },
    });

    if (!value) return;

    this.apiaryService.updateApiary(apiary.id, {
      name: value.name.trim(),
      hivesNumber: Number(value.hivesNumber) || 0,
      latitude: value.latitude,
      longitude: value.longitude,
      location: value.location || null,
      dateEstablished: value.dateEstablished || null,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary updated.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  async deleteRow(apiary: Apiary): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Delete Apiary',
      message: `Delete "${apiary.name}"? All beehive data will be lost.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.apiaryService.deleteApiary(apiary.id).subscribe({
      next: res => {
        if (res.success) {
          this.reload();
          this.toast.success('Apiary deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => this.toast.error('Something went wrong. Please try again.'),
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
  }

  // ── Private ──────────────────────────────────────────────

  private reload(): void {
    this.store.dispatch(ApiariesActions.reload());
    this.store.dispatch(BeehivesActions.reload());
  }
}
