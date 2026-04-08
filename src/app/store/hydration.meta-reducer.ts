import { ActionReducer, INIT, UPDATE } from '@ngrx/store';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'bhm_auth';

export function createHydrationMetaReducer(platformId: object) {
  return function hydrationMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
    return (state, action) => {
      if (!isPlatformBrowser(platformId)) {
        return reducer(state, action);
      }

      // On app init: restore from localStorage
      if (action.type === INIT || action.type === UPDATE) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            return reducer({ ...state, ...JSON.parse(stored) }, action);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const nextState = reducer(state, action);

      // Persist only the essentials — skip loading/error flags
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          auth: {
            user: nextState.auth.user,
            token: nextState.auth.token,
            loading: false,
            error: null,
          },
          employeeAuth: {
            employee: nextState.employeeAuth.employee,
            token: nextState.employeeAuth.token,
            loading: false,
            error: null,
          },
        }));
      } catch {}

      return nextState;
    };
  };
}
