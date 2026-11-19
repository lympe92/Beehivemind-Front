import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { aiChatReducer } from '../../store/ai-chat/ai-chat.reducer';
import { AiChatEffects } from '../../store/ai-chat/ai-chat.effects';
import { onboardingReducer } from '../../store/onboarding/onboarding.reducer';
import { OnboardingEffects } from '../../store/onboarding/onboarding.effects';
import { wizardRedirectGuard } from '../../core/onboarding/wizard-redirect';
import type { PageHelpId } from '../../core/help/page-help';

/** The page's entry in `core/help/page-help.ts`: the top bar's "How this page works" reads it from the active route. */
const help = (id: PageHelpId) => ({ help: id });

const pages: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then((m) => m.UserDashboardComponent),
    data: help('dashboard'),
  },
  {
    path: 'apiary',
    children: [
      {
        path: '',
        loadComponent: () => import('./apiary/apiary').then((m) => m.ApiaryComponent),
        data: help('apiaries'),
      },
      {
        path: 'details',
        loadComponent: () => import('./apiary/apiary-details').then((m) => m.ApiaryDetailsComponent),
        data: help('apiaryCards'),
      },
      {
        path: 'map',
        loadComponent: () => import('./apiary/apiary-map').then((m) => m.ApiaryMapComponent),
        data: help('apiaryMap'),
      },
      {
        path: ':id',
        loadComponent: () => import('./apiary/apiary-view/apiary-view').then((m) => m.ApiaryViewComponent),
        data: help('apiaryView'),
      },
    ],
  },
  {
    path: 'beehives',
    loadComponent: () => import('./beehives/beehives').then((m) => m.BeehivesComponent),
    data: help('beehives'),
  },
  {
    path: 'treatments',
    children: [
      {
        path: '',
        loadComponent: () => import('./treatments/treatments').then((m) => m.TreatmentsComponent),
        data: help('treatments'),
      },
      {
        path: 'details',
        loadComponent: () => import('./treatments/treatments-details').then((m) => m.TreatmentsDetailsComponent),
        data: help('treatmentSessions'),
      },
    ],
  },
  {
    path: 'inspections',
    loadComponent: () => import('./inspections/inspections').then((m) => m.InspectionsComponent),
    data: help('inspections'),
  },
  {
    path: 'feeding',
    loadComponent: () => import('./feeding/feeding').then((m) => m.FeedingComponent),
    data: help('feeding'),
  },
  {
    path: 'harvest',
    loadComponent: () => import('./harvest/harvest').then((m) => m.HarvestComponent),
    data: help('harvest'),
  },
  {
    path: 'financial',
    loadComponent: () => import('./financial/financial').then((m) => m.FinancialComponent),
    data: help('financial'),
  },
  {
    path: 'todo',
    children: [
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      {
        path: 'list',
        loadComponent: () => import('./todo/todo-list/todo-list').then((m) => m.TodoListComponent),
        data: help('todoList'),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./calendar/calendar-page').then((m) => m.CalendarPageComponent),
        data: help('calendar'),
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
    data: help('profile'),
  },
  {
    // The chat's slice lives on its route, not in the root store: nobody
    // else reads it, and its polling effects would otherwise sit in the
    // initial bundle of every page.
    path: 'ai-chat',
    providers: [provideState('aiChat', aiChatReducer), provideEffects(AiChatEffects)],
    children: [
      {
        path: '',
        loadComponent: () => import('./ai-chat/ai-chat-page/ai-chat-page').then(m => m.AiChatPageComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./ai-chat/ai-chat-page/ai-chat-page').then(m => m.AiChatPageComponent),
      },
    ],
  },
];

/**
 * One component-less parent for the whole zone, for what every page shares:
 * the "Getting started" guide's slice (here, not in the root store, so none
 * of it is in the initial bundle; the layout's popup reads it) and the setup
 * wizard's redirect, which runs once on entering /user and before any page
 * renders, not on every page change.
 */
export const userRoutes: Routes = [
  {
    path: '',
    providers: [provideState('onboarding', onboardingReducer), provideEffects(OnboardingEffects)],
    canActivate: [wizardRedirectGuard],
    children: pages,
  },
];
