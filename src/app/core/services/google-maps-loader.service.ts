import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private platformId = inject(PLATFORM_ID);
  readonly mapsLoaded = signal(false);

  load(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const w = window as unknown as Record<string, unknown> & {
      google?: { maps?: { importLibrary?: unknown } };
    };

    if (w.google?.maps?.importLibrary) {
      this.mapsLoaded.set(true);
      return;
    }

    if (document.getElementById('google-maps-script')) return;

    const callbackName = '__googleMapsReady';
    w[callbackName] = () => {
      delete w[callbackName];
      setTimeout(() => this.mapsLoaded.set(true));
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
