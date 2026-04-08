import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestService } from './request.service';
import { User } from '../../store/auth/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private request = inject(RequestService);

  login(email: string, password: string): Observable<{ user: User; token: string }> {
    return this.request
      .postRequest<{ token: string; user: User }>('user/login', { email, password })
      .pipe(map((res) => ({ user: res.data.user, token: res.data.token })));
  }

  register(data: {
    name: string;
    surname: string;
    email: string;
    password: string;
    country?: string;
  }): Observable<void> {
    return this.request.postRequest('user/register', data).pipe(map(() => void 0));
  }

  confirmEmail(token: string): Observable<void> {
    return this.request.postRequest('user/confirm-email', { token }).pipe(map(() => void 0));
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.request
      .postRequest('user/request-password-reset', { email })
      .pipe(map(() => void 0));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.request
      .postRequest('user/reset-password', { token, password })
      .pipe(map(() => void 0));
  }

  logout(): Observable<void> {
    return this.request.postRequest('user/logout').pipe(map(() => void 0));
  }

  clearSession(): void {
    // Token is managed by NgRx store — logout effect calls this
  }
}
