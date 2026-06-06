import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { exhaustMap, take } from 'rxjs';
import { selectToken } from '../../store/auth/auth.selectors';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only attach the user token to our own API calls...
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  // ...and never to admin/employee endpoints — those are handled by employeeInterceptor.
  if (req.url.includes('/api/admin') || req.url.includes('/api/employee')) return next(req);

  const store = inject(Store);

  return store.select(selectToken).pipe(
    take(1),
    exhaustMap((token) => {
      if (!token) return next(req);
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};
