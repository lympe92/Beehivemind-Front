import { Routes } from '@angular/router';
import { employeeRoleGuard } from '../../core/guards/employee-role.guard';

export const adminRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile').then((m) => m.AdminProfileComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-management/user-management').then((m) => m.UserManagementComponent),
  },
  {
    // The sidebar has linked here for moderators since before the route existed.
    path: 'moderation',
    canActivate: [employeeRoleGuard('moderator')],
    loadComponent: () =>
      import('./moderation/moderation').then((m) => m.AdminModerationComponent),
  },
  {
    path: 'employees',
    canActivate: [employeeRoleGuard('admin')],
    loadComponent: () =>
      import('./employee-management/employee-management').then((m) => m.EmployeeManagementComponent),
  },
  {
    path: 'coupons',
    canActivate: [employeeRoleGuard('admin')],
    loadComponent: () =>
      import('./coupons/coupons').then((m) => m.CouponsComponent),
  },
  {
    path: 'ai-responses',
    canActivate: [employeeRoleGuard('admin')],
    loadComponent: () =>
      import('./ai-responses/ai-responses').then((m) => m.AiResponsesComponent),
  },
  {
    path: 'raw',
    canActivate: [employeeRoleGuard('superadmin')],
    loadComponent: () =>
      import('./raw-data/raw-index/raw-index').then((m) => m.RawIndexComponent),
  },
  {
    path: 'raw/:model',
    canActivate: [employeeRoleGuard('superadmin')],
    loadComponent: () =>
      import('./raw-data/raw-list/raw-list').then((m) => m.RawListComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
