import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentSession } from '../models/treatment-session.model';
import { TreatmentTypeService, TreatmentTypePayload } from './treatment-type.service';
import { TreatmentInstanceService, TreatmentInstancePayload } from './treatment-instance.service';

/** Raw treatment-session payload as returned by the API (snake_case). */
interface TreatmentSessionPayload {
  id: number;
  treatment_type_id: number;
  apiary_id?: number | null;
  start_date: string;
  notes?: string | null;
  treatment_type?: TreatmentTypePayload | null;
  beehive_ids?: number[];
  instances?: TreatmentInstancePayload[];
  created_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TreatmentSessionService {
  private request = inject(RequestService);
  private typeService = inject(TreatmentTypeService);
  private instanceService = inject(TreatmentInstanceService);

  getAll(): Observable<ApiResponse<TreatmentSession[]>> {
    return this.request.getRequest<TreatmentSessionPayload[]>('treatment-sessions').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(s => this.fromApi(s)) }))
    );
  }

  create(data: {
    treatmentTypeId: number;
    apiaryId: number | null;
    startDate: string;
    beehiveIds: number[];
    notes: string | null;
  }): Observable<ApiResponse<TreatmentSession>> {
    return this.request.postRequest<TreatmentSessionPayload>('treatment-sessions', {
      treatment_type_id: data.treatmentTypeId,
      apiary_id:         data.apiaryId,
      start_date:        data.startDate,
      beehive_ids:       data.beehiveIds,
      notes:             data.notes,
    }).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`treatment-sessions/${id}`);
  }

  fromApi(s: TreatmentSessionPayload): TreatmentSession {
    return {
      id:              s.id,
      treatmentTypeId: s.treatment_type_id,
      apiaryId:        s.apiary_id ?? null,
      startDate:       s.start_date,
      notes:           s.notes ?? null,
      treatmentType:   s.treatment_type ? this.typeService.fromApi(s.treatment_type) : null,
      beehiveIds:      s.beehive_ids ?? [],
      instances:       (s.instances ?? []).map(i => this.instanceService.fromApi(i)),
      createdAt:       s.created_at ?? null,
    };
  }
}
