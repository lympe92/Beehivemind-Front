import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MapPickerComponent } from '../../../shared/components/ui/map-picker/map-picker';
import {
  AddApiaryModalComponent,
  AddApiaryModalData,
  AddApiaryModalResult,
} from '../../../shared/components/ui/modal/add-apiary-modal/add-apiary-modal';

interface ApiaryForm {
  name: string;
  hivesNumber: number | null;
}

@Component({
  selector: 'app-apiary',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DataTableComponent, CardComponent, MapPickerComponent],
  templateUrl: './apiary.html',
  styleUrl: './apiary.scss',
})
export class ApiaryComponent implements OnInit {
  private store = inject(Store);
  private apiaryService = inject(ApiaryService);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  mapCenter: google.maps.LatLngLiteral = { lat: 37.9838, lng: 23.7275 };
  mapZoom = 6;
  markerPosition: google.maps.LatLngLiteral | null = null;

  readonly columns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'hivesNumber', label: 'Hives', width: '80px' },
    { key: 'coords', label: 'Coordinates' },
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

  editingId: number | null = null;
  editForm: ApiaryForm = this.blank();

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
  }

  // ── Map ──────────────────────────────────────────────────

  onRowSelect(apiary: Apiary): void {
    this.mapCenter = { lat: apiary.latitude, lng: apiary.longitude };
    this.markerPosition = { lat: apiary.latitude, lng: apiary.longitude };
    this.mapZoom = 12;
  }

  // ── Add ──────────────────────────────────────────────────

  async startAdd(): Promise<void> {
    const result = await this.modal.open<AddApiaryModalResult, AddApiaryModalData>(
      AddApiaryModalComponent,
      {
        type: 'center',
        width: '640px',
        data: {
          existingNames: this.allApiaries().map(a => a.name),
        },
      },
    );

    if (!result) return;

    this.apiaryService.createApiary(result).subscribe({
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

  startEdit(apiary: Apiary): void {
    this.editingId = apiary.id;
    this.editForm = { name: apiary.name, hivesNumber: apiary.hivesNumber };
    this.markerPosition = { lat: apiary.latitude, lng: apiary.longitude };
    this.mapCenter = { lat: apiary.latitude, lng: apiary.longitude };
    this.mapZoom = 12;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  confirmEdit(): void {
    if (this.editingId === null) return;
    if (!this.editForm.name?.trim()) {
      this.toast.error('Name is required.');
      return;
    }

    this.apiaryService.updateApiary(this.editingId, {
      name: this.editForm.name,
      hivesNumber: Number(this.editForm.hivesNumber),
      latitude: this.markerPosition?.lat,
      longitude: this.markerPosition?.lng,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
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

  private blank(): ApiaryForm {
    return { name: '', hivesNumber: null };
  }
}
