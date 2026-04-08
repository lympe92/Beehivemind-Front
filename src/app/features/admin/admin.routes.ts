import { Routes } from '@angular/router';
import { employeeRoleGuard } from '../../core/guards/employee-role.guard';

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
