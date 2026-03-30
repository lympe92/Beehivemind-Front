import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-management/user-management').then((m) => m.UserManagementComponent),
  },
];
