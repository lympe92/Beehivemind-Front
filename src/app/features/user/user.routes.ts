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
      {
        path: ':id',
        loadComponent: () => import('./apiary/apiary-view/apiary-view').then((m) => m.ApiaryViewComponent),
      },
    ],
  },
  {
    path: 'beehives',
    loadComponent: () => import('./beehives/beehives').then((m) => m.BeehivesComponent),
  },
  {
    path: 'treatments',
    children: [
      {
        path: '',
        loadComponent: () => import('./treatments/treatments').then((m) => m.TreatmentsComponent),
      },
      {
        path: 'details',
        loadComponent: () => import('./treatments/treatments-details').then((m) => m.TreatmentsDetailsComponent),
      },
    ],
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
    path: 'todo',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () => import('./todo/todo-list/todo-list').then((m) => m.TodoListComponent),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPageComponent),
      },
    ],
  },
  {
    path: 'calendar',
    redirectTo: 'todo/calendar',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile').then((m) => m.ProfileComponent),
  },
];
