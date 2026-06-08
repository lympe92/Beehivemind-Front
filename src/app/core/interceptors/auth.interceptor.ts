import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Authentication is carried by an HttpOnly cookie set by the backend, so the
 * token is never exposed to JavaScript. We only need to send credentials on
 * our own API calls; the cookie does the rest. Admin/employee endpoints use a
 * separate cookie, but the backend selects it by route — the frontend just
 * needs credentials enabled here too.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  return next(req.clone({ withCredentials: true }));
};
