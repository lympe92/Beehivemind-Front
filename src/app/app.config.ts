import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  PLATFORM_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore, META_REDUCERS } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { appReducers, appEffects } from './store';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { employeeInterceptor } from './core/interceptors/employee.interceptor';
import { createHydrationMetaReducer } from './store/hydration.meta-reducer';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([employeeInterceptor, authInterceptor])),
    provideStore(appReducers),
    {
      provide: META_REDUCERS,
      useFactory: (platformId: object) => createHydrationMetaReducer(platformId),
      deps: [PLATFORM_ID],
      multi: true,
    },
    provideEffects(appEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideClientHydration(withEventReplay()),
  ],
};
