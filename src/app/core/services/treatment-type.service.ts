import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentType } from '../models/treatment-type.model';

/** Raw treatment-type payload as returned by the API (snake_case). */
export interface TreatmentTypePayload {
  id: number;
  name: string;
  disease: string;
  product: string;
  dose?: string | null;
  notes?: string | null;
  interval_days?: number | null;
  repetitions?: number | null;
  is_recurring?: boolean;
  created_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TreatmentTypeService {
  private request = inject(RequestService);

  getAll(): Observable<ApiResponse<TreatmentType[]>> {
    return this.request.getRequest<TreatmentTypePayload[]>('treatment-types').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(t => this.fromApi(t)) }))
    );
  }

  create(data: Partial<TreatmentType>): Observable<ApiResponse<TreatmentType>> {
    return this.request.postRequest<TreatmentTypePayload>('treatment-types', this.toApi(data)).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  update(id: number, data: Partial<TreatmentType>): Observable<ApiResponse<TreatmentType>> {
    return this.request.putRequest<TreatmentTypePayload>(`treatment-types/${id}`, this.toApi(data)).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`treatment-types/${id}`);
  }

  private toApi(t: Partial<TreatmentType>): object {
    return {
      ...(t.name          !== undefined && { name: t.name }),
      ...(t.disease       !== undefined && { disease: t.disease }),
      ...(t.product       !== undefined && { product: t.product }),
      ...(t.dose          !== undefined && { dose: t.dose }),
      ...(t.notes         !== undefined && { notes: t.notes }),
      ...(t.intervalDays  !== undefined && { interval_days: t.intervalDays }),
      ...(t.repetitions   !== undefined && { repetitions: t.repetitions }),
    };
  }

  fromApi(t: TreatmentTypePayload): TreatmentType {
    return {
      id:          t.id,
      name:        t.name,
      disease:     t.disease,
      product:     t.product,
      dose:        t.dose ?? null,
      notes:       t.notes ?? null,
      intervalDays: t.interval_days ?? null,
      repetitions: t.repetitions ?? null,
      isRecurring: t.is_recurring ?? (t.interval_days !== null && t.interval_days !== undefined),
      createdAt:   t.created_at ?? null,
    };
  }
}