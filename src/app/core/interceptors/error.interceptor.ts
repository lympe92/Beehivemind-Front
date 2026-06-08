import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/ui/toast/toast.service';
import { AuthActions } from '../../store/auth/auth.actions';
import { EmployeeAuthActions } from '../../store/employee-auth/employee-auth.actions';

/**
 * Auth endpoints where a 401 is an expected "invalid credentials" response that
 * the component surfaces itself — not a session expiry.
 */
const AUTH_PATHS = [
  'user/login',
  'user/register',
  'user/auth/google',
  'user/2fa',
  'user/confirm-email',
  'user/resend-confirmation',
  'user/request-password-reset',
  'user/reset-password',
  'employee/login',
  'employee/2fa',
];

/**
 * Single source of truth for HTTP-error toasts. Components no longer toast on
 * HTTP failures — they rely on this interceptor, which surfaces:
 *  - 401 → the session expired, so sign the user out.
 *  - 0   → the server is unreachable (network/CORS).
 *  - else → the server's `message`, falling back to a generic notice.
 * Auth flows (login, register, 2FA) are skipped — they display their own errors
 * inline. The error is always re-thrown so component flows (loading flags,
 * NgRx failure actions, etc.) keep working.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const toast = inject(ToastService);
  const store = inject(Store);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (AUTH_PATHS.some((p) => req.url.includes(p))) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        const isEmployee = req.url.includes('/api/admin') || req.url.includes('/api/employee');
        toast.error('Your session has expired. Please sign in again.');
        store.dispatch(isEmployee ? EmployeeAuthActions.logout() : AuthActions.logout());
      } else if (error.status === 0) {
        toast.error('Unable to reach the server. Please check your connection.');
      } else {
        const body = error.error as { message?: string } | null;
        toast.error(body?.message ?? 'Something went wrong. Please try again.');
      }

      return throwError(() => error);
    }),
  );
};
