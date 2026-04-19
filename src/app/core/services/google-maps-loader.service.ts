import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private platformId = inject(PLATFORM_ID);
  readonly mapsLoaded = signal(false);

  load(): void {
    if (!isPlatformBrowser(this.platformId)) return;

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
}
