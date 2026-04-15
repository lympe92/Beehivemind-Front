import { createReducer, on } from '@ngrx/store';
import { ProfileActions } from './profile.actions';
import { initialProfileState } from './profile.state';

export const profileReducer = createReducer(
  initialProfileState,

  // ── Load ────────────────────────────────────────────────────
  on(ProfileActions.loadProfile, (state) => ({
    ...state, loading: true,
  })),
  on(ProfileActions.loadProfileSuccess, (state, { profile }) => ({
    ...state, loading: false, data: profile,
  })),
  on(ProfileActions.loadProfileFailure, (state) => ({
    ...state, loading: false,
  })),

  // ── Saving flag (all mutating operations) ───────────────────
  on(
    ProfileActions.updateProfile,
    ProfileActions.changePassword,
    ProfileActions.setup2FA,
    ProfileActions.confirm2FA,
    ProfileActions.disable2FA,
    ProfileActions.regenerateBackupCodes,
    (state) => ({ ...state, saving: true }),
  ),

  // ── Update profile ───────────────────────────────────────────
  on(ProfileActions.updateProfileSuccess, (state, { profile }) => ({
    ...state, saving: false, data: profile,
  })),

  // ── Change password ──────────────────────────────────────────
  on(ProfileActions.changePasswordSuccess, (state) => ({
    ...state,
    saving: false,
    data: state.data ? { ...state.data, has_password: true } : state.data,
  })),

  // ── 2FA setup ────────────────────────────────────────────────
  on(ProfileActions.setup2FASuccess, (state, { secret, otpauthUrl }) => ({
    ...state, saving: false, tfaSetupSecret: secret, tfaSetupOtpauthUrl: otpauthUrl,
  })),

  // ── 2FA confirm ──────────────────────────────────────────────
  on(ProfileActions.confirm2FASuccess, (state, { backupCodes }) => ({
    ...state,
    saving: false,
    tfaBackupCodes: backupCodes,
    tfaSetupSecret: null,
    tfaSetupOtpauthUrl: null,
    data: state.data ? { ...state.data, two_factor_enabled: true } : state.data,
  })),

  // ── 2FA disable ──────────────────────────────────────────────
  on(ProfileActions.disable2FASuccess, (state) => ({
    ...state,
    saving: false,
    data: state.data ? { ...state.data, two_factor_enabled: false } : state.data,
  })),

  // ── Backup codes ─────────────────────────────────────────────
  on(ProfileActions.regenerateBackupCodesSuccess, (state, { backupCodes }) => ({
    ...state, saving: false, tfaBackupCodes: backupCodes,
  })),

  // ── Any failure resets saving ────────────────────────────────
  on(
    ProfileActions.updateProfileFailure,
    ProfileActions.changePasswordFailure,
    ProfileActions.setup2FAFailure,
    ProfileActions.confirm2FAFailure,
    ProfileActions.disable2FAFailure,
    ProfileActions.regenerateBackupCodesFailure,
    (state) => ({ ...state, saving: false }),
  ),
);
