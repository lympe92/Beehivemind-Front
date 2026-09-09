import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Turns the writes that mean "this beekeeper is actually using the product"
 * into GA4 events, from the one place every API call passes through. Nothing
 * per feature: a component that creates a record does not know analytics
 * exists, and a new entity gets tracked by adding one line here.
 *
 * Creations only. An edit or a delete says nothing about activation; the first
 * `create_inspection` of an account is the event the funnel is built on.
 */
const CREATIONS: { path: RegExp; event: (body: unknown) => string }[] = [
  { path: /^apiaries$/,                   event: () => 'create_apiary' },
  { path: /^beehives$/,                   event: () => 'create_beehive' },
  // Inspections, feedings and harvests share one endpoint; the body says which.
  { path: /^records(\/apiary\/\d+)?$/,    event: (body) => `create_${(body as { type?: string } | null)?.type ?? 'record'}` },
  { path: /^treatment-types$/,            event: () => 'create_treatment_type' },
  { path: /^treatment-sessions$/,         event: () => 'create_treatment_session' },
  { path: /^costs$/,                      event: () => 'create_cost' },
  { path: /^cost-categories$/,            event: () => 'create_cost_category' },
  { path: /^ai\/chat$/,                   event: () => 'ai_message' },
  { path: /^user\/2fa\/confirm$/,         event: () => 'enable_2fa' },
];

export const analyticsInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'POST' || !req.url.startsWith(environment.apiUrl)) return next(req);

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const creation = CREATIONS.find((c) => c.path.test(path));
  if (!creation) return next(req);

  const analytics = inject(AnalyticsService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) {
        analytics.event(creation.event(req.body), { resource: path.split('/')[0] });
      }
    }),
  );
};
