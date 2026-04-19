import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../core/modal/modal.types';
import { ModalShellComponent } from '../../../../shared/components/ui/modal/modal-shell/modal-shell';
import { MapPickerComponent } from '../../../../shared/components/ui/map-picker/map-picker';

export interface AddApiaryModalData {
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
  imports: [FormsModule, DecimalPipe, ModalShellComponent, MapPickerComponent],
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

  onMarkerChange(pos: google.maps.LatLngLiteral): void {
    this.markerPosition = pos;
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
