import { createReducer, on } from '@ngrx/store';
import { EmployeeAuthActions } from './employee-auth.actions';
import { initialEmployeeAuthState } from './employee-auth.state';

export const employeeAuthReducer = createReducer(
  initialEmployeeAuthState,

  on(EmployeeAuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(EmployeeAuthActions.loginSuccess, (state, { employee, token }) => ({
    ...state,
    employee,
    token,
    loading: false,
    error: null,
    twoFactorToken: null,
    twoFactorStep: null,
  })),

  on(EmployeeAuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(EmployeeAuthActions.loginRequires2FASetup, (state, { twoFactorToken }) => ({
    ...state,
    loading: false,
    error: null,
    twoFactorToken,
    twoFactorStep: 'setup' as const,
  })),

  on(EmployeeAuthActions.loginRequires2FA, (state, { twoFactorToken }) => ({
    ...state,
    loading: false,
    error: null,
    twoFactorToken,
    twoFactorStep: 'verify' as const,
  })),

  on(EmployeeAuthActions.resetLogin, () => initialEmployeeAuthState),

  on(EmployeeAuthActions.logoutSuccess, () => initialEmployeeAuthState),
);
