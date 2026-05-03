import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { AgendaItem } from '../models/agenda-item.model';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private request = inject(RequestService);

  getAll(): Observable<AgendaItem[]> {
    return this.request.getRequest<any[]>('agenda').pipe(
      map((res: ApiResponse<any[]>) => (res.data ?? []).map(i => this.fromApi(i)))
    );
  }

  getByApiary(apiaryId: number): Observable<AgendaItem[]> {
    return this.request.getRequest<any[]>(`agenda?apiary_id=${apiaryId}`).pipe(
      map((res: ApiResponse<any[]>) => (res.data ?? []).map(i => this.fromApi(i)))
    );
  }

  private fromApi(i: any): AgendaItem {
    return {
      type:          i.type,
      title:         i.title,
      subtitle:      i.subtitle,
      scheduledDate: i.scheduled_date,
      isOverdue:     i.is_overdue ?? false,
      entityType:    i.entity_type,
      entityId:      i.entity_id,
      sessionId:     i.session_id ?? undefined,
      apiaryId:      i.apiary_id ?? undefined,
    };
  }
}