import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/public/public.routes').then((m) => m.publicRoutes),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/user-layout/user-layout').then((m) => m.UserLayoutComponent),
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/user/user.routes').then((m) => m.userRoutes),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout').then((m) => m.PublicLayoutComponent),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  { path: '**', redirectTo: '' },
];
