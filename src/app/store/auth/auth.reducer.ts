import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.loginNeedsCountry, (state, { user, token }) => ({
    ...state,
    loading: false,
    error: null,
    pendingUser: user,
    pendingToken: token,
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    pendingUser: null,
    pendingToken: null,
  })),

  on(AuthActions.login, AuthActions.loginWithGoogle, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
    twoFactorToken: null,
    twoFactorPending: null,
  })),

  on(AuthActions.loginFailure, (state, { error, retryAfterMinutes }) => ({
    ...state,
    loading: false,
    error,
    retryAfterMinutes: retryAfterMinutes ?? null,
  })),

  on(AuthActions.loginRequires2FA, (state, { twoFactorToken }) => ({
    ...state,
    loading: false,
    error: null,
    twoFactorToken,
    twoFactorPending: 'verify' as const,
  })),

  on(AuthActions.loginRequires2FASetup, (state, { twoFactorToken }) => ({
    ...state,
    loading: false,
    error: null,
    twoFactorToken,
    twoFactorPending: 'setup' as const,
  })),

  on(AuthActions.verify2FA, AuthActions.verify2FABackup, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.verify2FAFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logoutSuccess, () => initialAuthState),
);
