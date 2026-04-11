import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from './auth.state';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ email: string; password: string }>(),
    'Login Success': props<{ user: User; token: string }>(),
    'Login Failure': props<{ error: string }>(),
    'Login With Google': props<{ credential: string }>(),

    // 2FA during login
    'Login Requires 2FA': props<{ twoFactorToken: string }>(),
    'Login Requires 2FA Setup': props<{ twoFactorToken: string }>(),
    'Verify 2FA': props<{ twoFactorToken: string; code: string }>(),
    'Verify 2FA Backup': props<{ twoFactorToken: string; backupCode: string }>(),
    'Verify 2FA Failure': props<{ error: string }>(),

    Logout: emptyProps(),
    'Logout Success': emptyProps(),
  },
});
