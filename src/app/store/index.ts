import { authReducer } from './auth/auth.reducer';
import { AuthEffects } from './auth/auth.effects';
import { employeeAuthReducer } from './employee-auth/employee-auth.reducer';
import { EmployeeAuthEffects } from './employee-auth/employee-auth.effects';

export const appReducers = {
  auth: authReducer,
  employeeAuth: employeeAuthReducer,
};

export const appEffects = [AuthEffects, EmployeeAuthEffects];
