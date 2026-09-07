import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleTagManagerService {
  private platformId = inject(PLATFORM_ID);

  init(): void {
    if (!isPlatformBrowser(this.platformId) || !environment.googleTagManagerId) return;

    const containerId = environment.googleTagManagerId;

    const win = window as unknown as { dataLayer?: unknown[] };
    win.dataLayer = win.dataLayer ?? [];
    win.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    document.head.appendChild(script);
  }
}
