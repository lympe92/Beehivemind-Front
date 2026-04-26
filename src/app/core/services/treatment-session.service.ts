import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentSession } from '../models/treatment-session.model';
import { TreatmentTypeService } from './treatment-type.service';
import { TreatmentInstanceService } from './treatment-instance.service';

@Injectable({ providedIn: 'root' })
export class TreatmentSessionService {
  private request = inject(RequestService);
  private typeService = inject(TreatmentTypeService);
  private instanceService = inject(TreatmentInstanceService);

  getAll(): Observable<ApiResponse<TreatmentSession[]>> {
    return this.request.getRequest<any>('treatment-sessions').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map((s: any) => this.fromApi(s)) }))
    );
  }

  create(data: {
    treatmentTypeId: number;
    apiaryId: number | null;
    startDate: string;
    beehiveIds: number[];
    notes: string | null;
  }): Observable<ApiResponse<TreatmentSession>> {
    return this.request.postRequest<any>('treatment-sessions', {
      treatment_type_id: data.treatmentTypeId,
      apiary_id:         data.apiaryId,
      start_date:        data.startDate,
      beehive_ids:       data.beehiveIds,
      notes:             data.notes,
    }).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
    );
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`treatment-sessions/${id}`);
  }

  fromApi(s: any): TreatmentSession {
    return {
      id:              s.id,
      treatmentTypeId: s.treatment_type_id,
      apiaryId:        s.apiary_id ?? null,
      startDate:       s.start_date,
      notes:           s.notes ?? null,
      treatmentType:   s.treatment_type ? this.typeService.fromApi(s.treatment_type) : null,
      beehiveIds:      s.beehive_ids ?? [],
      instances:       (s.instances ?? []).map((i: any) => this.instanceService.fromApi(i)),
      createdAt:       s.created_at ?? null,
    };
  }
}
