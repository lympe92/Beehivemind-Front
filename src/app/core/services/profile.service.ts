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
}
