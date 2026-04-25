import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { MODAL_DATA } from '../../../../../core/modal/modal.types';
import { Apiary } from '../../../../../core/models/apiary.model';
import { ModalShellComponent } from '../modal-shell/modal-shell';
import { MapPickerComponent } from '../../map-picker/map-picker';
import { InputComponent } from '../../../form-fields/input/input.component';

export interface ApiaryFormData {
  apiary?: Apiary;
}

export interface ApiaryFormResult {
  name: string;
  hivesNumber: number | null;
  location: string;
  dateEstablished: string | null;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-apiary-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalShellComponent, MapPickerComponent, InputComponent],
  templateUrl: './apiary-form-modal.html',
  styleUrl: './apiary-form-modal.scss',
})
export class ApiaryFormModalComponent implements OnInit {
  private dialogRef = inject(DialogRef<ApiaryFormResult>);
  readonly data = inject<ApiaryFormData>(MODAL_DATA);

  form = new FormGroup({
    name: new FormControl('', { validators: [Validators.required, Validators.maxLength(55)], nonNullable: true }),
    hivesNumber: new FormControl<number | null>(null),
    location: new FormControl('', { nonNullable: true }),
    dateEstablished: new FormControl<string | null>(null),
  });

  marker = signal<google.maps.LatLngLiteral | null>(null);
  geocoding = signal(false);
  coordinatesError = signal(false);

  get isEdit(): boolean {
    return !!this.data.apiary;
  }

  get title(): string {
    return this.isEdit ? 'Edit Apiary' : 'Add Apiary';
  }

  ngOnInit(): void {
    const a = this.data.apiary;
    if (a) {
      this.form.patchValue({
        name: a.name,
        hivesNumber: a.hivesNumber,
        location: a.location ?? '',
        dateEstablished: a.dateEstablished ?? null,
      });
      if (a.latitude && a.longitude) {
        this.marker.set({ lat: a.latitude, lng: a.longitude });
      }
    }
  }

  onMarkerChange(pos: google.maps.LatLngLiteral): void {
    this.marker.set(pos);
    this.coordinatesError.set(false);
    this.reverseGeocode(pos);
  }

  private reverseGeocode(pos: google.maps.LatLngLiteral): void {
    if (typeof google === 'undefined') return;
    this.geocoding.set(true);
    new google.maps.Geocoder().geocode({ location: pos }, (results, status) => {
      this.geocoding.set(false);
      if (status === 'OK' && results?.[0]) {
        this.form.patchValue({ location: this.extractLocation(results[0]) });
      }
    });
  }

  private extractLocation(result: google.maps.GeocoderResult): string {
    const get = (type: string) =>
      result.address_components.find(c => c.types.includes(type))?.long_name;
    const city = get('locality') ?? get('administrative_area_level_2') ?? get('administrative_area_level_1');
    const country = get('country');
    if (city && country) return `${city}, ${country}`;
    return result.formatted_address;
  }

  submit(): void {
    if (!this.marker()) {
      this.coordinatesError.set(true);
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, hivesNumber, location, dateEstablished } = this.form.getRawValue();
    const coords = this.marker()!;
    this.dialogRef.close({
      name,
      hivesNumber: hivesNumber ?? null,
      location,
      dateEstablished: dateEstablished || null,
      latitude: coords.lat,
      longitude: coords.lng,
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
