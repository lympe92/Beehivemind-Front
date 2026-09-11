import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  PLATFORM_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideStore, META_REDUCERS } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routes } from './app.routes';
import { appReducers, appEffects } from './store';
import { storeDevtools } from './store/devtools';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { analyticsInterceptor } from './core/interceptors/analytics.interceptor';
import { createHydrationMetaReducer } from './store/hydration.meta-reducer';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // `fetch` on both sides. On the server it is what lets src/server.ts keep
    // the blog's API answers for a minute (it wraps the global fetch), which
    // is what stands between a crawler burst and the API's per-address limit.
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, analyticsInterceptor]),
    ),
    provideStore(appReducers),
    {
      provide: META_REDUCERS,
      useFactory: (platformId: object) => createHydrationMetaReducer(platformId),
      deps: [PLATFORM_ID],
      multi: true,
    },
    provideEffects(appEffects),
    // Empty in a production build (see store/devtools.ts).
    ...storeDevtools,
    provideClientHydration(withEventReplay()),
  ],
};
