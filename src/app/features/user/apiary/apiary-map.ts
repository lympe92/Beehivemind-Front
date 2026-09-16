import { Component, effect, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { Apiary } from '../../../core/models/apiary.model';

@Component({
  selector: 'app-apiary-map',
  standalone: true,
  imports: [],
  templateUrl: './apiary-map.html',
  styleUrl: './apiary-map.scss',
})
export class ApiaryMapComponent implements OnInit {
  private store      = inject(Store);
  private mapsLoader = inject(GoogleMapsLoaderService);

  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private apiaries   = this.store.selectSignal(selectAllApiaries);
  private mapReady   = signal(false);
  viewReady          = signal(false);

  private map: google.maps.Map | null = null;
  private infoWindow: google.maps.InfoWindow | null = null;
  private markers: google.maps.Marker[] = [];

  constructor() {
    // Init map once DOM + Maps API are both ready
    effect(() => {
      if (!this.viewReady() || !this.mapsLoader.mapsLoaded()) return;
      if (this.mapReady()) return;
      this.initMap();
    });

    // Re-render markers whenever apiaries data changes (after map is ready)
    effect(() => {
      const apiaries = this.apiaries();
      if (!this.mapReady()) return;
      this.renderMarkers(apiaries);
    });
  }

  ngOnInit(): void {
    this.store.dispatch(ApiariesActions.load());
    this.mapsLoader.load();
    this.viewReady.set(true);
  }

  /**
   * Google Maps paints for the size its container had when it was created. The
   * effect that gets here runs before the page has finished laying out — the
   * frame is `height: 100%` of a column that is not measured yet — so the map
   * was built into a box of zero height and stayed a grey rectangle until a
   * window resize told it to look again. Wait for the frame to have a size, and
   * keep watching it: collapsing and reopening the sidebar changes it too.
   */
  private initMap(): void {
    const frame = this.mapEl.nativeElement;

    if (!frame.clientHeight || !frame.clientWidth) {
      requestAnimationFrame(() => this.initMap());
      return;
    }

    this.map = new google.maps.Map(frame, {
      center: { lat: 37.9838, lng: 23.7275 },
      zoom: 6,
      mapTypeId: 'roadmap',
      streetViewControl: false,
      fullscreenControl: false,
    });
    this.infoWindow = new google.maps.InfoWindow();
    this.mapReady.set(true);

    new ResizeObserver(() => this.renderMarkers(this.apiaries())).observe(frame);
  }

  private renderMarkers(apiaries: Apiary[]): void {
    if (!this.map) return;

    this.markers.forEach(m => m.setMap(null));
    this.markers = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    apiaries.forEach(apiary => {
      if (!apiary.latitude || !apiary.longitude) return;

      const position = { lat: apiary.latitude, lng: apiary.longitude };
      bounds.extend(position);
      hasValidCoords = true;

      const marker = new google.maps.Marker({
        position,
        map: this.map!,
        title: apiary.name,
      });
      this.markers.push(marker);

      marker.addListener('click', () => {
        this.infoWindow!.setContent(this.buildInfoContent(apiary));
        this.infoWindow!.open(this.map!, marker);
      });
    });

    if (hasValidCoords && this.markers.length > 1) {
      this.map.fitBounds(bounds);
    } else if (hasValidCoords) {
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(12);
    }
  }

  private buildInfoContent(apiary: Apiary): string {
    const location = apiary.location ? `<div class="am-info__location">${apiary.location}</div>` : '';
    const date     = apiary.dateEstablished
      ? `<div class="am-info__date">Est. ${apiary.dateEstablished}</div>`
      : '';
    return `
      <div class="am-info">
        <div class="am-info__name">${apiary.name}</div>
        <div class="am-info__hives">${apiary.hivesNumber} hive${apiary.hivesNumber !== 1 ? 's' : ''}</div>
        ${location}
        ${date}
      </div>`;
  }
}
