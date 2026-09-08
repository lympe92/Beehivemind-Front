import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { runWhenIdle } from '../utils/run-when-idle';

@Injectable({ providedIn: 'root' })
export class GoogleTagManagerService {
  private platformId = inject(PLATFORM_ID);

  init(): void {
    if (!isPlatformBrowser(this.platformId) || !environment.googleTagManagerId) return;

    const containerId = environment.googleTagManagerId;

    const win = window as unknown as { dataLayer?: unknown[] };
    win.dataLayer = win.dataLayer ?? [];

    // The container is 120 KB on the wire; loading it after the page is idle
    // keeps it out of the first-paint critical path.
    runWhenIdle(() => {
      win.dataLayer!.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
      document.head.appendChild(script);
    });
  }
}
