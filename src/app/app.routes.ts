import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { employeeGuard } from './core/guards/employee.guard';

export const routes: Routes = [
  // User pages (beekeeper)
  {
    path: 'user',
    loadComponent: () =>
      import('./layouts/user-layout/user-layout').then((m) => m.UserLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/user/user.routes').then((m) => m.userRoutes),
  },
  // User auth. Component-less on purpose: the auth screens carry their own
  // brand lockup and legal line (AuthCard), so no header or footer wraps them.
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  // Admin login (standalone, no layout)
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login').then((m) => m.AdminLoginComponent),
  },
  // Admin panel (employee-protected)
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    canActivate: [employeeGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  // Public pages, and the catch-all with them.
  //
  // LAST on purpose. `path: ''` matches a zero-segment prefix of every URL, so
  // once its children are consulted the `**` at the end of publicRoutes answers
  // anything — including `/user/…` and `/admin/…`. First in the array, it made
  // the whole signed-in half of the app render the public 404. The zones above
  // therefore get first refusal, and only what none of them claims falls here.
  //
  // There is deliberately no `{ path: '**', redirectTo: '' }` after this: the
  // 404 renders in place, because redirecting made every broken link a 302 to
  // the home page — a soft 404 to a crawler.
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
];
