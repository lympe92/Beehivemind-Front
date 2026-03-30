import { authReducer } from './auth/auth.reducer';
import { AuthEffects } from './auth/auth.effects';

export const appReducers = {
  auth: authReducer,
};

export const appEffects = [AuthEffects];
