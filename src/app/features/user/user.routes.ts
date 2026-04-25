import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.UserDashboardComponent),
  },
  {
    path: 'apiary',
    children: [
      {
        path: '',
        loadComponent: () => import('./apiary/apiary').then((m) => m.ApiaryComponent),
      },
      {
        path: 'details',
        loadComponent: () => import('./apiary/apiary-details').then((m) => m.ApiaryDetailsComponent),
      },
      {
        path: 'map',
        loadComponent: () => import('./apiary/apiary-map').then((m) => m.ApiaryMapComponent),
      },
    ],
  },
  {
    path: 'beehives',
    loadComponent: () => import('./beehives/beehives').then((m) => m.BeehivesComponent),
  },
  {
    path: 'inspections',
    loadComponent: () => import('./inspections/inspections').then((m) => m.InspectionsComponent),
  },
  {
    path: 'feeding',
    loadComponent: () => import('./feeding/feeding').then((m) => m.FeedingComponent),
  },
  {
    path: 'harvest',
    loadComponent: () => import('./harvest/harvest').then((m) => m.HarvestComponent),
  },
  {
    path: 'financial',
    loadComponent: () => import('./financial/financial').then((m) => m.FinancialComponent),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPageComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
  },
];
