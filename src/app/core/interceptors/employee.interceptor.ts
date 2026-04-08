import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { exhaustMap, take } from 'rxjs';
import { selectEmployeeToken } from '../../store/employee-auth/employee-auth.selectors';

export const employeeInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept admin API calls
  if (!req.url.includes('/api/admin') && !req.url.includes('/api/employee')) {
    return next(req);
  }

  const store = inject(Store);

  return store.select(selectEmployeeToken).pipe(
    take(1),
    exhaustMap((token) => {
      if (!token) return next(req);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};