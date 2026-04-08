import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import {
  EMPLOYEE_ROLE_HIERARCHY,
  EmployeeRole,
} from '../../store/employee-auth/employee-auth.state';
import { selectEmployeeRole } from '../../store/employee-auth/employee-auth.selectors';

export const employeeRoleGuard = (minRole: EmployeeRole): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectEmployeeRole).pipe(
      take(1),
      map((role) => {
        if (!role) return router.createUrlTree(['/admin/login']);
        const myLevel = EMPLOYEE_ROLE_HIERARCHY[role] ?? 0;
        const minLevel = EMPLOYEE_ROLE_HIERARCHY[minRole] ?? 0;
        return myLevel >= minLevel ? true : router.createUrlTree(['/admin/dashboard']);
      }),
    );
  };
};
