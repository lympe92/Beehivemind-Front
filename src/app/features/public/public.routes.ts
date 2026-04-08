import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then((m) => m.HomeComponent),
    data: { seoKey: 'home' },
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features-page/features-page').then((m) => m.FeaturesPageComponent),
    data: { seoKey: 'features' },
  },
  {
    path: 'app',
    loadComponent: () => import('./app-page/app-page').then((m) => m.AppPageComponent),
    data: { seoKey: 'app' },
  },
  {
    path: 'apiariesandbeehives',
    loadComponent: () =>
      import('./apiaries-and-beehives/apiaries-and-beehives').then(
        (m) => m.ApiariesAndBeehivesComponent,
      ),
    data: { seoKey: 'apiariesAndBeehives' },
  },
  {
    path: 'financial',
    loadComponent: () => import('./financial/financial').then((m) => m.FinancialComponent),
    data: { seoKey: 'financial' },
  },
  {
    path: 'harvestandfeeding',
    loadComponent: () =>
      import('./harvest-and-feeding/harvest-and-feeding').then(
        (m) => m.HarvestAndFeedingComponent,
      ),
    data: { seoKey: 'harvestAndFeeding' },
  },
  {
    path: 'inspections',
    loadComponent: () =>
      import('./inspections/inspections').then((m) => m.InspectionsComponent),
    data: { seoKey: 'inspections' },
  },
  {
    path: 'help',
    loadComponent: () => import('./help/help').then((m) => m.HelpComponent),
    data: { seoKey: 'help' },
  },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy').then((m) => m.PrivacyComponent),
    data: { seoKey: 'privacy' },
  },
];
