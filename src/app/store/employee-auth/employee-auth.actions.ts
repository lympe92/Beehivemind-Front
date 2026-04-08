import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Employee } from './employee-auth.state';

export const EmployeeAuthActions = createActionGroup({
  source: 'EmployeeAuth',
  events: {
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ employee: Employee; token: string }>(),
    'Login Failure': props<{ error: string }>(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),
  },
});