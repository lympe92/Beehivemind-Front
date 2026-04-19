import { Component, inject, input, OnInit, output } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../../../core/services/google-maps-loader.service';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [GoogleMap, MapMarker],
  templateUrl: './map-picker.html',
  styleUrl: './map-picker.scss',
})
export class MapPickerComponent implements OnInit {
  private loader = inject(GoogleMapsLoaderService);

  readonly center = input<google.maps.LatLngLiteral>({ lat: 37.9838, lng: 23.7275 });
  readonly zoom = input(6);
  readonly marker = input<google.maps.LatLngLiteral | null>(null);
  readonly interactive = input(true);

  readonly markerChange = output<google.maps.LatLngLiteral>();

  readonly mapsLoaded = this.loader.mapsLoaded;

  readonly mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    zoomControl: true,
  };

  ngOnInit(): void {
    this.loader.load();
  }

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!this.interactive() || !event.latLng) return;
    this.markerChange.emit({ lat: event.latLng.lat(), lng: event.latLng.lng() });
  }
}
