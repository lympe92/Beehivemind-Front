import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.UserDashboardComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
  },
];
