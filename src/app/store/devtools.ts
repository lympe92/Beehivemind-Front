import { EnvironmentProviders } from '@angular/core';
import { provideStoreDevtools } from '@ngrx/store-devtools';

/**
 * Redux DevTools, for `ng serve` only. The production build swaps this file
 * for `devtools.prod.ts` (angular.json → fileReplacements), so the package
 * never reaches a visitor: it was 11 kB of the initial download, the part that
 * took the bundle over its 500 kB budget, for a tool no visitor uses.
 */
export const storeDevtools: EnvironmentProviders[] = [provideStoreDevtools({ maxAge: 25 })];
