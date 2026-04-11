import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private request = inject(RequestService);

  getProfile(): Observable<ApiResponse<UserProfile>> {
    return this.request.getRequest<UserProfile>('user/profile');
  }

  updateProfile(data: Partial<Pick<UserProfile, 'name' | 'surname' | 'country' | 'unit' | 'show_hints'>>): Observable<ApiResponse<UserProfile>> {
    return this.request.putRequest<UserProfile>('user/profile', data);
  }

  changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Observable<ApiResponse<void>> {
    return this.request.putRequest<void>('user/change-password', data);
  }

  setup2FA(): Observable<ApiResponse<{ secret: string; otpauth_url: string }>> {
    return this.request.postRequest<{ secret: string; otpauth_url: string }>('user/2fa/setup');
  }

  confirm2FA(code: string): Observable<ApiResponse<{ backup_codes: string[] }>> {
    return this.request.postRequest<{ backup_codes: string[] }>('user/2fa/confirm', { code });
  }

  disable2FA(password: string): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>('user/2fa', { password });
  }

  regenerateBackupCodes(): Observable<ApiResponse<{ backup_codes: string[] }>> {
    return this.request.postRequest<{ backup_codes: string[] }>('user/2fa/backup-codes/regenerate');
  }
}
