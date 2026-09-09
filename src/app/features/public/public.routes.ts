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
    path: 'pricing',
    loadComponent: () => import('./pricing/pricing').then((m) => m.PricingComponent),
    data: { seoKey: 'pricing' },
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
    // No seoKey: HelpComponent applies its own, so it can add the FAQPage node
    // built from the troubleshooting accordion.
    loadComponent: () => import('./help/help').then((m) => m.HelpComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about').then((m) => m.AboutComponent),
    data: { seoKey: 'about' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./contact/contact').then((m) => m.ContactComponent),
    data: { seoKey: 'contact' },
  },
  // The old marketing link that every "Need a consultation?" CTA carried.
  // Absolute on purpose: served as a 301 the relative form resolves against the
  // request path and sends the visitor to /pages/contact, which does not exist.
  { path: 'pages/contact-us', redirectTo: '/contact' },
  {
    path: 'privacy',
    loadComponent: () => import('./privacy/privacy').then((m) => m.PrivacyComponent),
    data: { seoKey: 'privacy' },
  },
  {
    path: 'terms',
    loadComponent: () => import('./terms/terms').then((m) => m.TermsComponent),
    data: { seoKey: 'terms' },
  },
  {
    path: 'blog',
    loadComponent: () => import('./blog/blog').then((m) => m.BlogComponent),
    data: { seoKey: 'blog' },
  },
  {
    // Before `blog/:slug`, or the slug route swallows "category".
    path: 'blog/category/:slug',
    loadComponent: () =>
      import('./blog-category/blog-category').then((m) => m.BlogCategoryComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./blog-article/blog-article').then((m) => m.BlogArticleComponent),
  },
  // Last: anything unmatched renders the 404 inside the public shell. The
  // matching 404 status is set in app.routes.server.ts.
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
