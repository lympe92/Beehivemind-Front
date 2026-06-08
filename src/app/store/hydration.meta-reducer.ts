import { ActionReducer, INIT, UPDATE } from '@ngrx/store';
import { isPlatformBrowser } from '@angular/common';
import { AppState } from './index';

const STORAGE_KEY = 'bhm_auth';

/** Subset of the root state that is persisted to localStorage. */
type PersistedState = Pick<AppState, 'auth' | 'employeeAuth'>;

export function createHydrationMetaReducer(platformId: object) {
  return function hydrationMetaReducer(
    reducer: ActionReducer<AppState>,
  ): ActionReducer<AppState> {
    return (state, action) => {
      if (!isPlatformBrowser(platformId)) {
        return reducer(state, action);
      }

      // On app init: restore from localStorage
      if (action.type === INIT || action.type === UPDATE) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Partial<PersistedState>;
            return reducer({ ...state, ...parsed } as AppState, action);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const nextState = reducer(state, action);

      // Persist the user/employee object only — tokens live in HttpOnly cookies
      // and must never touch localStorage (XSS-safe).
      try {
        const snapshot: PersistedState = {
          auth: {
            ...nextState.auth,
            token: null,
            pendingToken: null,
            twoFactorToken: null,
            loading: false,
            error: null,
          },
          employeeAuth: {
            ...nextState.employeeAuth,
            token: null,
            twoFactorToken: null,
            loading: false,
            error: null,
          },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {}

      return nextState;
    };
  };
}
