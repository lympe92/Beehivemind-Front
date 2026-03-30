import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../store/auth/auth.state';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(email: string, password: string): Observable<{ user: User; token: string }> {
    // TODO: replace with real HTTP call
    throw new Error('Not implemented');
  }

  clearSession(): void {
    // TODO: clear localStorage/cookies
  }
}
