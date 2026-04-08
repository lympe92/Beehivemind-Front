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
  })),

  on(EmployeeAuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(EmployeeAuthActions.logoutSuccess, () => initialEmployeeAuthState),
);
