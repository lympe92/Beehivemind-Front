import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { RequestService } from './request.service';
import { Employee } from '../../store/employee-auth/employee-auth.state';

@Injectable({ providedIn: 'root' })
export class EmployeeAuthService {
  private request = inject(RequestService);

  login(email: string, password: string): Observable<{ employee: Employee; token: string }> {
    return this.request
      .postRequest<{ token: string; employee: Employee }>('employee/login', { email, password })
      .pipe(map((res) => ({ employee: res.data.employee, token: res.data.token })));
  }

  clearSession(): void {
    // Token revoked server-side on logout action
  }
}
