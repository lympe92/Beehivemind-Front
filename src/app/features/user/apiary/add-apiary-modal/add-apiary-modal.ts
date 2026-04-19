import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { MODAL_DATA } from '../../../../core/modal/modal.types';
import { ModalShellComponent } from '../../../../shared/components/ui/modal/modal-shell/modal-shell';

export interface AddApiaryModalData {
  mapsLoaded: boolean;
  existingNames: string[];
}

export interface AddApiaryModalResult {
  name: string;
  hivesNumber: number;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-add-apiary-modal',
  standalone: true,
  imports: [FormsModule, DecimalPipe, GoogleMap, MapMarker, ModalShellComponent],
  templateUrl: './add-apiary-modal.html',
  styleUrl: './add-apiary-modal.scss',
})
export class AddApiaryModalComponent {
  private dialogRef = inject(DialogRef<AddApiaryModalResult>);
  readonly data = inject<AddApiaryModalData>(MODAL_DATA);

  name = '';
  hivesNumber: number | null = null;
  markerPosition: google.maps.LatLngLiteral | null = null;
  error = signal<string | null>(null);

  mapCenter: google.maps.LatLngLiteral = { lat: 37.9838, lng: 23.7275 };
  mapZoom = 6;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
  };

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;
    this.markerPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    this.error.set(null);
  }

  save(): void {
    if (!this.name.trim()) {
      this.error.set('Name is required.');
      return;
    }
    if (!this.markerPosition) {
      this.error.set('Please select a location on the map.');
      return;
    }
    if (this.data.existingNames.includes(this.name.trim())) {
      this.error.set(`An apiary named "${this.name.trim()}" already exists.`);
      return;
    }
    this.dialogRef.close({
      name: this.name.trim(),
      hivesNumber: Number(this.hivesNumber) || 0,
      latitude: this.markerPosition.lat,
      longitude: this.markerPosition.lng,
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
