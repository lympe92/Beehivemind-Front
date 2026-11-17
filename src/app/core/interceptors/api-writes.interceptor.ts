import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Tells whoever listens that the team's data changed: a successful write to
 * one of the record endpoints. The "Getting started" guide refetches its
 * counts on it; nothing here knows the guide exists.
 */
@Injectable({ providedIn: 'root' })
export class ApiWrites {
  readonly done$ = new Subject<string>();
}

/** The endpoints whose writes change a count the guide reads. */
const RECORDS = /^(apiaries|beehives|records|treatment-|costs|cost-categories|team\/)/;

export const apiWritesInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' || !req.url.startsWith(environment.apiUrl)) return next(req);
  const path = req.url.slice(environment.apiUrl.length);
  if (!RECORDS.test(path)) return next(req);

  const writes = inject(ApiWrites);
  return next(req).pipe(tap(e => e instanceof HttpResponse && e.ok && writes.done$.next(path)));
};
