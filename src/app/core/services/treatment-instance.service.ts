import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentInstance } from '../models/treatment-instance.model';

/** Raw treatment-instance payload as returned by the API (snake_case). */
export interface TreatmentInstancePayload {
  id: number;
  treatment_session_id: number;
  scheduled_date: string;
  actual_date?: string | null;
  status: TreatmentInstance['status'];
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TreatmentInstanceService {
  private request = inject(RequestService);

  getByDateRange(from: string, to: string): Observable<ApiResponse<TreatmentInstance[]>> {
    return this.request.getRequest<TreatmentInstancePayload[]>(`treatment-instances?from=${from}&to=${to}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(i => this.fromApi(i)) }))
    );
  }

  update(id: number, data: {
    status: 'planned' | 'done' | 'skipped';
    actualDate?: string | null;
    notes?: string | null;
  }): Observable<ApiResponse<TreatmentInstance>> {
    return this.request.patchRequest<TreatmentInstancePayload>(`treatment-instances/${id}`, {
      status:      data.status,
      actual_date: data.actualDate ?? null,
      notes:       data.notes ?? null,
    }).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  fromApi(i: TreatmentInstancePayload): TreatmentInstance {
    return {
      id:                 i.id,
      treatmentSessionId: i.treatment_session_id,
      scheduledDate:      i.scheduled_date,
      actualDate:         i.actual_date ?? null,
      status:             i.status,
      notes:              i.notes ?? null,
    };
  }
}
