import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../shared/components/ui/toast/toast.service';
import { ProfileActions } from './profile.actions';

@Injectable()
export class ProfileEffects {
  private actions$ = inject(Actions);
  private profileService = inject(ProfileService);
  private toast = inject(ToastService);

  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.loadProfile),
      exhaustMap(() =>
        this.profileService.getProfile().pipe(
          map((res) => ProfileActions.loadProfileSuccess({ profile: res.data })),
          catchError(() => of(ProfileActions.loadProfileFailure({ error: 'Failed to load profile.' }))),
        ),
      ),
    ),
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.updateProfile),
      exhaustMap(({ data }) =>
        this.profileService.updateProfile(data as any).pipe(
          map((res) => {
            this.toast.success('Profile updated successfully.');
            return ProfileActions.updateProfileSuccess({ profile: res.data });
          }),
          catchError((err) => {
            this.toast.error(err?.error?.message ?? 'Something went wrong. Please try again.');
            return of(ProfileActions.updateProfileFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );

  changePassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.changePassword),
      exhaustMap((payload) =>
        this.profileService.changePassword({
          current_password: payload.current_password,
          new_password: payload.new_password,
          new_password_confirmation: payload.new_password_confirmation,
        }).pipe(
          map((res) => {
            const hadPassword = !!payload.current_password;
            this.toast.success(hadPassword ? 'Password changed successfully.' : 'Password set successfully.');
            return ProfileActions.changePasswordSuccess();
          }),
          catchError((err) => {
            this.toast.error(err?.error?.message ?? 'Something went wrong. Please try again.');
            return of(ProfileActions.changePasswordFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );

  setup2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.setup2FA),
      exhaustMap(() =>
        this.profileService.setup2FA().pipe(
          map((res) => ProfileActions.setup2FASuccess({
            secret: res.data.secret,
            otpauthUrl: res.data.otpauth_url,
          })),
          catchError((err) => {
            this.toast.error('Something went wrong. Please try again.');
            return of(ProfileActions.setup2FAFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );

  confirm2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.confirm2FA),
      exhaustMap(({ code }) =>
        this.profileService.confirm2FA(code).pipe(
          map((res) => {
            this.toast.success('2FA enabled successfully.');
            return ProfileActions.confirm2FASuccess({ backupCodes: res.data.backup_codes });
          }),
          catchError((err) => {
            this.toast.error(err?.error?.message ?? 'Invalid code.');
            return of(ProfileActions.confirm2FAFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );

  disable2FA$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.disable2FA),
      exhaustMap(({ password }) =>
        this.profileService.disable2FA(password).pipe(
          map(() => {
            this.toast.success('2FA disabled.');
            return ProfileActions.disable2FASuccess();
          }),
          catchError((err) => {
            this.toast.error(err?.error?.message ?? 'Incorrect password.');
            return of(ProfileActions.disable2FAFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );

  regenerateBackupCodes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProfileActions.regenerateBackupCodes),
      exhaustMap(() =>
        this.profileService.regenerateBackupCodes().pipe(
          map((res) => ProfileActions.regenerateBackupCodesSuccess({ backupCodes: res.data.backup_codes })),
          catchError((err) => {
            this.toast.error('Something went wrong.');
            return of(ProfileActions.regenerateBackupCodesFailure({ error: err?.error?.message ?? '' }));
          }),
        ),
      ),
    ),
  );
}
