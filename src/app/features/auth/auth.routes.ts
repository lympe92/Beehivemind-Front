import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password').then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'confirmation',
    loadComponent: () =>
      import('./confirmation/confirmation').then((m) => m.ConfirmationComponent),
  },
  {
    path: '2fa',
    loadComponent: () =>
      import('./two-factor-verify/two-factor-verify').then((m) => m.TwoFactorVerifyComponent),
  },
  {
    path: 'complete-profile',
    loadComponent: () =>
      import('./complete-profile/complete-profile').then((m) => m.CompleteProfileComponent),
  },
];
