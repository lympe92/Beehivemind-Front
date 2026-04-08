import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectIsEmployeeLoggedIn } from '../../store/employee-auth/employee-auth.selectors';

export const employeeGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsEmployeeLoggedIn).pipe(
    take(1),
    map((isLoggedIn) => (isLoggedIn ? true : router.createUrlTree(['/admin/login']))),
  );
};