import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (state) => state.user);
export const selectToken = createSelector(selectAuthState, (state) => state.token);
export const selectIsLoggedIn = createSelector(selectAuthState, (state) => !!state.token);
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

export const selectUserRole = createSelector(selectCurrentUser, (user) => user?.role ?? null);
export const selectIsAdmin = createSelector(
  selectUserRole,
  (role) => role === 'admin' || role === 'superadmin',
);
export const selectIsSuperAdmin = createSelector(
  selectUserRole,
  (role) => role === 'superadmin',
);

export const selectTwoFactorToken = createSelector(selectAuthState, (state) => state.twoFactorToken);
export const selectTwoFactorPending = createSelector(selectAuthState, (state) => state.twoFactorPending);
