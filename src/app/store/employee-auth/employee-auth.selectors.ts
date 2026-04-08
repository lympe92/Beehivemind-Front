import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EMPLOYEE_ROLE_HIERARCHY, EmployeeAuthState } from './employee-auth.state';

export const selectEmployeeAuthState = createFeatureSelector<EmployeeAuthState>('employeeAuth');

export const selectCurrentEmployee = createSelector(selectEmployeeAuthState, (s) => s.employee);
export const selectEmployeeToken = createSelector(selectEmployeeAuthState, (s) => s.token);
export const selectIsEmployeeLoggedIn = createSelector(selectEmployeeAuthState, (s) => !!s.token);
export const selectEmployeeAuthLoading = createSelector(selectEmployeeAuthState, (s) => s.loading);
export const selectEmployeeAuthError = createSelector(selectEmployeeAuthState, (s) => s.error);
export const selectEmployeeRole = createSelector(selectCurrentEmployee, (e) => e?.role ?? null);

export const selectEmployeeHasRole = (minRole: string) =>
  createSelector(selectEmployeeRole, (role) => {
    if (!role) return false;
    const myLevel = EMPLOYEE_ROLE_HIERARCHY[role] ?? 0;
    const minLevel = EMPLOYEE_ROLE_HIERARCHY[minRole as keyof typeof EMPLOYEE_ROLE_HIERARCHY] ?? 0;
    return myLevel >= minLevel;
  });

export const selectIsAtLeastSupport = selectEmployeeHasRole('support');
export const selectIsAtLeastModerator = selectEmployeeHasRole('moderator');
export const selectIsAtLeastAdmin = selectEmployeeHasRole('admin');
export const selectIsSuperAdmin = selectEmployeeHasRole('superadmin');