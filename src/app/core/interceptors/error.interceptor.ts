import { HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
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
  // Deleting the account answers a wrong password with 401; the card says so.
  'user/account',
  // `/auth/invite` renders every state of its token itself.
  'team/invite/',
  'employee/login',
  'employee/2fa',
];

/**
 * Public reads whose failure the page itself renders. A blog slug that does not
 * exist is a 404 *page*, not a notification floating over one — and on the
 * server render there is nobody to read a toast anyway.
 */
const SILENT_PATHS = ['blog/posts', 'blog/categories', 'contact'];

/**
 * For one request whose failure the caller shows in place — the invite dialog
 * turns every refusal into a field error, and a toast on top of it would say
 * the same thing twice.
 */
const INLINE_ERRORS = new HttpContextToken<boolean>(() => false);

export function inlineErrors(): HttpContext {
  return new HttpContext().set(INLINE_ERRORS, true);
}

/**
 * Single source of truth for HTTP-error toasts. Components no longer toast on
 * HTTP failures — they rely on this interceptor, which surfaces:
 *  - 401 → the session expired, so sign the user out. When the API says the
 *          account itself is gone (an editor removed by the team owner), the
 *          login screen says that instead.
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

      if (SILENT_PATHS.some((p) => req.url.includes(p)) || req.context.get(INLINE_ERRORS)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        const isEmployee = req.url.includes('/api/admin') || req.url.includes('/api/employee');
        const body = error.error as { code?: string } | null;

        if (!isEmployee && body?.code === 'account_removed') {
          store.dispatch(AuthActions.accountRemoved());
        } else {
          toast.error('Your session has expired. Please sign in again.');
          store.dispatch(isEmployee ? EmployeeAuthActions.logout() : AuthActions.logout());
        }
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
