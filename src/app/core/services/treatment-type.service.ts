import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { TreatmentType } from '../models/treatment-type.model';

@Injectable({ providedIn: 'root' })
export class TreatmentTypeService {
  private request = inject(RequestService);

  getAll(): Observable<ApiResponse<TreatmentType[]>> {
    return this.request.getRequest<any>('treatment-types').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map((t: any) => this.fromApi(t)) }))
    );
  }

  create(data: Partial<TreatmentType>): Observable<ApiResponse<TreatmentType>> {
    return this.request.postRequest<any>('treatment-types', this.toApi(data)).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
    );
  }

  update(id: number, data: Partial<TreatmentType>): Observable<ApiResponse<TreatmentType>> {
    return this.request.putRequest<any>(`treatment-types/${id}`, this.toApi(data)).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
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

  fromApi(t: any): TreatmentType {
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
