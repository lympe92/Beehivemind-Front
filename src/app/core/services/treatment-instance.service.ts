import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentInstance } from '../models/treatment-instance.model';

@Injectable({ providedIn: 'root' })
export class TreatmentInstanceService {
  private request = inject(RequestService);

  getByDateRange(from: string, to: string): Observable<ApiResponse<TreatmentInstance[]>> {
    return this.request.getRequest<any>(`treatment-instances?from=${from}&to=${to}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map((i: any) => this.fromApi(i)) }))
    );
  }

  update(id: number, data: {
    status: 'planned' | 'done' | 'skipped';
    actualDate?: string | null;
    notes?: string | null;
  }): Observable<ApiResponse<TreatmentInstance>> {
    return this.request.patchRequest<any>(`treatment-instances/${id}`, {
      status:      data.status,
      actual_date: data.actualDate ?? null,
      notes:       data.notes ?? null,
    }).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
    );
  }

  fromApi(i: any): TreatmentInstance {
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