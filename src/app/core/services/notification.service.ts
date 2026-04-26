import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, NotificationsListResponse } from '../models/notification.model';
import { ApiResponse } from '../models/api-response.model';
import { RequestService } from './request.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http    = inject(HttpClient);
  private request = inject(RequestService);
  private base    = environment.apiUrl;

  getAll(): Observable<{ notifications: Notification[]; unreadCount: number }> {
    return this.http.get<NotificationsListResponse>(`${this.base}notifications`).pipe(
      map(res => ({
        notifications: (res.data ?? []).map(n => this.fromApi(n)),
        unreadCount:   res.unread_count ?? 0,
      }))
    );
  }

  markRead(id: number): Observable<ApiResponse<Notification>> {
    return this.request.patchRequest<any>(`notifications/${id}/read`).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
    );
  }

  markAllRead(): Observable<ApiResponse<void>> {
    return this.request.postRequest<void>('notifications/read-all');
  }

  fromApi(n: any): Notification {
    return {
      id:         n.id,
      type:       n.type,
      title:      n.title,
      message:    n.message,
      entityType: n.entity_type,
      entityId:   n.entity_id,
      readAt:     n.read_at ?? null,
      isRead:     n.is_read ?? false,
      createdAt:  n.created_at ?? null,
    };
  }
}