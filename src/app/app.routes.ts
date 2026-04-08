import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { employeeGuard } from './core/guards/employee.guard';

export const routes: Routes = [
  // Public pages
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
  // User pages (beekeeper)
  {
    path: '',
    loadComponent: () =>
      import('./layouts/user-layout/user-layout').then((m) => m.UserLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/user/user.routes').then((m) => m.userRoutes),
  },
  // User auth
  {
    path: 'auth',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
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
  { path: '**', redirectTo: '' },
];
