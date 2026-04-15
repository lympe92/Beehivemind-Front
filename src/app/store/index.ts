import { authReducer } from './auth/auth.reducer';
import { AuthEffects } from './auth/auth.effects';
import { employeeAuthReducer } from './employee-auth/employee-auth.reducer';
import { EmployeeAuthEffects } from './employee-auth/employee-auth.effects';
import { profileReducer } from './profile/profile.reducer';
import { ProfileEffects } from './profile/profile.effects';

export const appReducers = {
  auth: authReducer,
  employeeAuth: employeeAuthReducer,
  profile: profileReducer,
};

export const appEffects = [AuthEffects, EmployeeAuthEffects, ProfileEffects];
