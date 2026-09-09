import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  /** Which door the sign-in came through, reported on the `login` event. */
  private loginMethod: 'email' | 'google' = 'email';

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) => {
        this.loginMethod = 'email';
        return this.authService.login(email, password).pipe(
          map((res) => {
            if (res.requires_2fa) {
              return AuthActions.loginRequires2FA({ twoFactorToken: res.twoFactorToken! });
            }
            return AuthActions.loginSuccess({ user: res.user!, token: res.token! });
          }),
          catchError((err) =>
            of(AuthActions.loginFailure({
              error: err?.error?.message ?? 'Login failed',
              retryAfterMinutes: err?.error?.retry_after_minutes ?? undefined,
            })),
          ),
        );
      }),
    ),
  );

  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithGoogle),
      exhaustMap(({ credential }) => {
        this.loginMethod = 'google';
        return this.authService.loginWithGoogle(credential).pipe(
          map((res) => {
            if (res.requires_2fa) {
              return AuthActions.loginRequires2FA({ twoFactorToken: res.twoFactorToken! });
            }
            // The Google button is also the sign-up form: the API says whether
            // this credential just created the account.
            if (res.isNewUser) {
              this.analytics.event('sign_up', { method: 'google' });
            }
            const user = res.user!;
            const token = res.token!;
            return user.country
              ? AuthActions.loginSuccess({ user, token })
              : AuthActions.loginNeedsCountry({ user, token });
          }),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: err?.error?.message ?? 'Google sign-in failed' })),
          ),
        );
      }),
    ),
  );

  // The user id itself is attached by GoogleAnalyticsService, which watches
  // the store; this is only the event that a sign-in happened.
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(() => this.analytics.event('login', { method: this.loginMethod })),
      ),
    { dispatch: false },
  );

  loginNeedsCountry$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginNeedsCountry),
        tap(() => this.router.navigate(['/auth/complete-profile'])),
      ),
    { dispatch: false },
  );

  loginRequires2FA$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginRequires2FA),
        tap(() => this.router.navigate(['/auth/2fa'])),
      ),
    { dispatch: false },
  );

  verify2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verify2FA),
      exhaustMap(({ twoFactorToken, code }) =>
        this.authService.verify2FA(twoFactorToken, { code }).pipe(
          map(({ user, token }) => AuthActions.loginSuccess({ user, token })),
          catchError((err) =>
            of(AuthActions.verify2FAFailure({ error: err?.error?.message ?? 'Invalid code' })),
          ),
        ),
      ),
    ),
  );

  verify2FABackup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verify2FABackup),
      exhaustMap(({ twoFactorToken, backupCode }) =>
        this.authService.verify2FA(twoFactorToken, { backup_code: backupCode }).pipe(
          map(({ user, token }) => AuthActions.loginSuccess({ user, token })),
          catchError((err) =>
            of(AuthActions.verify2FAFailure({ error: err?.error?.message ?? 'Invalid backup code' })),
          ),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())),
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => this.router.navigate(['/auth/login'])),
      ),
    { dispatch: false },
  );
}
