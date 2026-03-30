import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features-page/features-page').then((m) => m.FeaturesPageComponent),
  },
  {
    path: 'app',
    loadComponent: () => import('./app-page/app-page').then((m) => m.AppPageComponent),
  },
  {
    path: 'apiariesandbeehives',
    loadComponent: () =>
      import('./apiaries-and-beehives/apiaries-and-beehives').then(
        (m) => m.ApiariesAndBeehivesComponent,
      ),
  },
  {
    path: 'financial',
    loadComponent: () => import('./financial/financial').then((m) => m.FinancialComponent),
  },
  {
    path: 'harvestandfeeding',
    loadComponent: () =>
      import('./harvest-and-feeding/harvest-and-feeding').then(
        (m) => m.HarvestAndFeedingComponent,
      ),
  },
  {
    path: 'inspections',
    loadComponent: () =>
      import('./inspections/inspections').then((m) => m.InspectionsComponent),
  },
  {
    path: 'help',
    loadComponent: () => import('./help/help').then((m) => m.HelpComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy').then((m) => m.PrivacyComponent),
  },
];
