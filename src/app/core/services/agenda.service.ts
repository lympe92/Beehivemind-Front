import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { AgendaItem } from '../models/agenda-item.model';

/** Raw agenda item payload as returned by the API (snake_case). */
interface AgendaPayload {
  type: AgendaItem['type'];
  title: AgendaItem['title'];
  subtitle: AgendaItem['subtitle'];
  scheduled_date: string;
  is_overdue?: boolean;
  entity_type: string;
  entity_id: number;
  session_id?: number;
  apiary_id?: number;
}

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private request = inject(RequestService);

  getAll(): Observable<AgendaItem[]> {
    return this.request.getRequest<AgendaPayload[]>('agenda').pipe(
      map((res) => (res.data ?? []).map(i => this.fromApi(i)))
    );
  }

  getByApiary(apiaryId: number): Observable<AgendaItem[]> {
    return this.request.getRequest<AgendaPayload[]>(`agenda?apiary_id=${apiaryId}`).pipe(
      map((res) => (res.data ?? []).map(i => this.fromApi(i)))
    );
  }

  private fromApi(i: AgendaPayload): AgendaItem {
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