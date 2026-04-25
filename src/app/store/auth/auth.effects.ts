import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
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
        ),
      ),
    ),
  );

  loginWithGoogle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginWithGoogle),
      exhaustMap(({ credential }) =>
        this.authService.loginWithGoogle(credential).pipe(
          map((res) => {
            if (res.requires_2fa) {
              return AuthActions.loginRequires2FA({ twoFactorToken: res.twoFactorToken! });
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
        ),
      ),
    ),
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
