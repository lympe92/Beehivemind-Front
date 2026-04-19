import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Apiary } from '../../../core/models/apiary.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { environment } from '../../../../environments/environment';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries, selectApiariesLoading } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { DataTableComponent, ColumnDef, TablePagination } from '../../../shared/components/ui/data-table/data-table';
import { ToastService } from '../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../core/modal/modal.service';
import { CardComponent } from '../../../shared/components/ui/card/card';
import {
  AddApiaryModalComponent,
  AddApiaryModalData,
  AddApiaryModalResult,
} from './add-apiary-modal/add-apiary-modal';

interface ApiaryForm {
  name: string;
  hivesNumber: number | null;
}

@Component({
  selector: 'app-apiary',
  standalone: true,
  imports: [FormsModule, GoogleMap, MapMarker, DecimalPipe, DataTableComponent, CardComponent],
  templateUrl: './apiary.html',
  styleUrl: './apiary.scss',
})
export class ApiaryComponent implements OnInit {
  private store = inject(Store);
  private apiaryService = inject(ApiaryService);
  private platformId = inject(PLATFORM_ID);
  private toast = inject(ToastService);
  private modal = inject(ModalService);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  mapsLoaded = signal(false);

  mapCenter: google.maps.LatLngLiteral = { lat: 37.9838, lng: 23.7275 };
  mapZoom = 6;
  markerPosition: google.maps.LatLngLiteral | null = null;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
  };

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
    if (this.isBrowser) {
      this.loadMapsScript();
    }
  }

  // ── Map ──────────────────────────────────────────────────

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;
    this.markerPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
  }

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
          mapsLoaded: this.mapsLoaded(),
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

  private loadMapsScript(): void {
    if ((window as any).google?.maps?.importLibrary) {
      this.mapsLoaded.set(true);
      return;
    }

    if (document.getElementById('google-maps-script')) return;

    const callbackName = '__googleMapsReady';
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      setTimeout(() => this.mapsLoaded.set(true));
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error('Google Maps failed to load');
    document.head.appendChild(script);
  }

  private blank(): ApiaryForm {
    return { name: '', hivesNumber: null };
  }
}
