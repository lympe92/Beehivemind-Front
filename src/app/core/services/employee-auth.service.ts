import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestService } from './request.service';
import { Employee } from '../../store/employee-auth/employee-auth.state';

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private request = inject(RequestService);

  login(email: string, password: string): Observable<{
    employee?: Employee;
    token?: string;
    requires_2fa?: boolean;
    requires_2fa_setup?: boolean;
    twoFactorToken?: string;
  }> {
    return this.request
      .postRequest<{
        token?: string;
        employee?: Employee;
        requires_2fa?: boolean;
        requires_2fa_setup?: boolean;
        two_factor_token?: string;
      }>('employee/login', { email, password })
      .pipe(map((res) => ({
        employee: res.data.employee,
        token: res.data.token,
        requires_2fa: res.data.requires_2fa,
        requires_2fa_setup: res.data.requires_2fa_setup,
        twoFactorToken: res.data.two_factor_token,
      })));
  }

  getSetup2FA(twoFactorToken: string): Observable<{ secret: string; otpauthUrl: string }> {
    return this.request
      .postRequest<{ secret: string; otpauth_url: string }>('employee/2fa/setup', { two_factor_token: twoFactorToken })
      .pipe(map((res) => ({ secret: res.data.secret, otpauthUrl: res.data.otpauth_url })));
  }

  confirmSetup2FA(twoFactorToken: string, code: string): Observable<{ employee: Employee; token: string }> {
    return this.request
      .postRequest<{ token: string; employee: Employee }>('employee/2fa/setup/confirm', { two_factor_token: twoFactorToken, code })
      .pipe(map((res) => ({ employee: res.data.employee, token: res.data.token })));
  }

  verify2FA(twoFactorToken: string, payload: { code?: string; backup_code?: string }): Observable<{ employee: Employee; token: string }> {
    return this.request
      .postRequest<{ token: string; employee: Employee }>('employee/2fa/verify', { two_factor_token: twoFactorToken, ...payload })
      .pipe(map((res) => ({ employee: res.data.employee, token: res.data.token })));
  }

  clearSession(): void {
    // Token revoked server-side on logout action
  }
}
