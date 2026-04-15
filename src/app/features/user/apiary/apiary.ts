import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Apiary } from '../../../core/models/apiary.model';
import { Metadata } from '../../../core/models/api-response.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { environment } from '../../../../environments/environment';

interface ApiaryForm {
  name: string;
  hivesNumber: number | null;
}

type NotificationType = 'error' | 'success' | 'warning';

@Component({
  selector: 'app-apiary',
  standalone: true,
  imports: [FormsModule, GoogleMap, MapMarker, DecimalPipe],
  templateUrl: './apiary.html',
  styleUrl: './apiary.scss',
})
export class ApiaryComponent implements OnInit {
  private apiaryService = inject(ApiaryService);
  private platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  mapsLoaded = signal(false);

  // Map state
  mapCenter: google.maps.LatLngLiteral = { lat: 37.9838, lng: 23.7275 };
  mapZoom = 6;
  markerPosition: google.maps.LatLngLiteral | null = null;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
  };

  // Data
  apiaries = signal<Apiary[]>([]);
  meta     = signal<Metadata | null>(null);
  page     = signal(1);
  readonly perPage = 10;

  // Edit state
  editingId: number | null = null;
  editForm: ApiaryForm = this.blank();

  // Add state
  showAddForm = false;
  newForm: ApiaryForm = this.blank();

  // Notification
  notification: { type: NotificationType; message: string } | null = null;
  private notifTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
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

  startAdd(): void {
    this.cancelEdit();
    this.newForm = this.blank();
    this.showAddForm = true;
  }

  cancelAdd(): void {
    this.showAddForm = false;
  }

  confirmAdd(): void {
    if (!this.validate(this.newForm, true)) return;

    const duplicate = this.apiaries().some(a => a.name === this.newForm.name);
    if (duplicate) {
      this.notify('warning', `An apiary named "${this.newForm.name}" already exists.`);
      return;
    }

    this.apiaryService.createApiary({
      name: this.newForm.name,
      hivesNumber: Number(this.newForm.hivesNumber),
      latitude: this.markerPosition!.lat,
      longitude: this.markerPosition!.lng,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.showAddForm = false;
          this.load();
          this.notify('success', 'Apiary created.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Edit ─────────────────────────────────────────────────

  startEdit(apiary: Apiary): void {
    this.cancelAdd();
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
    if (this.editingId === null || !this.validate(this.editForm, false)) return;

    this.apiaryService.updateApiary(this.editingId, {
      name: this.editForm.name,
      hivesNumber: Number(this.editForm.hivesNumber),
      latitude: this.markerPosition?.lat,
      longitude: this.markerPosition?.lng,
    }).subscribe({
      next: res => {
        if (res.success) {
          this.editingId = null;
          this.load();
          this.notify('success', 'Apiary updated.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  // ── Delete ───────────────────────────────────────────────

  deleteRow(apiary: Apiary): void {
    if (!confirm(`Delete apiary "${apiary.name}"? All beehive data will be lost!`)) return;

    this.apiaryService.deleteApiary(apiary.id).subscribe({
      next: res => {
        if (res.success) {
          this.load();
          this.notify('success', 'Apiary deleted.');
        } else {
          this.notify('error', 'Something went wrong. Please try again.');
        }
      },
      error: () => this.notify('error', 'Something went wrong. Please try again.'),
    });
  }

  clearNotification(): void {
    this.notification = null;
  }

  // ── Private ──────────────────────────────────────────────

  private loadMapsScript(): void {
    // Script already loaded — Maps API is ready
    if ((window as any).google?.maps?.importLibrary) {
      this.mapsLoaded.set(true);
      return;
    }

    // Script tag already injected but not yet loaded — avoid duplicates
    if (document.getElementById('google-maps-script')) return;

    // Use `callback=` so Maps fires it only after the full API (incl. importLibrary) is ready.
    // `loading=async` is deprecated and does NOT expose importLibrary via a plain script tag.
    const callbackName = '__googleMapsReady';
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      // setTimeout defers the signal set to the next macrotask, preventing NG0100
      // (ExpressionChangedAfterItHasBeenCheckedError caused by <google-map> setting
      // tabIndex on its host during the same change-detection pass)
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

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }

  private load(): void {
    this.apiaryService.getApiaries(this.page(), this.perPage).subscribe(res => {
      if (res.success) {
        this.apiaries.set(res.data);
        this.meta.set(res.meta ?? null);
      }
    });
  }

  private validate(form: ApiaryForm, requireLocation: boolean): boolean {
    if (!form.name?.trim()) {
      this.notify('error', 'Name is required.');
      return false;
    }
    if (requireLocation && !this.markerPosition) {
      this.notify('error', 'Please select a location on the map.');
      return false;
    }
    return true;
  }

  private notify(type: NotificationType, message: string): void {
    if (this.notifTimer) clearTimeout(this.notifTimer);
    this.notification = { type, message };
    if (type !== 'error') {
      this.notifTimer = setTimeout(() => (this.notification = null), 5000);
    }
  }

  private blank(): ApiaryForm {
    return { name: '', hivesNumber: null };
  }
}
