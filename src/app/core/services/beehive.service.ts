import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Beehive } from '../models/beehive.model';

@Injectable({ providedIn: 'root' })
export class BeehiveService {
  private request = inject(RequestService);

  getBeehives(): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<any[]>('beehives').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map((b: any) => this.fromApi(b)) }))
    );
  }

  getBeehivesOfApiary(apiaryId: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<any[]>(`beehives/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map((b: any) => this.fromApi(b)) }))
    );
  }

  createBeehives(apiaryId: number, count: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.postRequest<Beehive[]>('beehives', { apiary_id: apiaryId, hives_number: count });
  }


  updateBeehive(id: number, data: Partial<Beehive>): Observable<ApiResponse<Beehive>> {
    const payload: any = {};
    if (data.name !== undefined) payload.number = parseInt(data.name, 10) || null;
    return this.request.putRequest<any>(`beehives/${id}`, payload).pipe(
      map(res => ({ ...res, data: res.data ? this.fromApi(res.data) : res.data }))
    );
  }

  deleteBeehive(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`beehives/${id}`);
  }

  private fromApi(b: any): Beehive {
    return {
      id:       b.id,
      uuid:     b.uuid,
      name:     b.name ?? String(b.number ?? b.id),
      apiaryId: b.apiary_id,
      queen:    b.queen ?? null,
    };
  }
}
