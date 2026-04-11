import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestService } from './request.service';
import { User } from '../../store/auth/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private request = inject(RequestService);

  login(email: string, password: string): Observable<{
    user?: User; token?: string;
    requires_2fa?: boolean; twoFactorToken?: string;
  }> {
    return this.request
      .postRequest<{ token?: string; user?: User; requires_2fa?: boolean; two_factor_token?: string }>('user/login', { email, password })
      .pipe(map((res) => ({
        user: res.data.user,
        token: res.data.token,
        requires_2fa: res.data.requires_2fa,
        twoFactorToken: res.data.two_factor_token,
      })));
  }

  verify2FA(twoFactorToken: string, payload: { code?: string; backup_code?: string }): Observable<{ user: User; token: string }> {
    return this.request
      .postRequest<{ token: string; user: User }>('user/2fa/verify', { two_factor_token: twoFactorToken, ...payload })
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

  resendConfirmation(email: string): Observable<void> {
    return this.request.postRequest('user/resend-confirmation', { email }).pipe(map(() => void 0));
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

  loginWithGoogle(credential: string): Observable<{ user: User; token: string }> {
    return this.request
      .postRequest<{ token: string; user: User }>('user/auth/google', { credential })
      .pipe(map((res) => ({ user: res.data.user, token: res.data.token })));
  }

  logout(): Observable<void> {
    return this.request.postRequest('user/logout').pipe(map(() => void 0));
  }

  clearSession(): void {
    // Token is managed by NgRx store — logout effect calls this
  }
}
