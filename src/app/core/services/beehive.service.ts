import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Beehive } from '../models/beehive.model';

/** Raw beehive payload as returned by the API (snake_case). */
interface BeehivePayload {
  id: number;
  uuid: string;
  name?: string;
  number?: number;
  apiary_id: number;
  queen?: Beehive['queen'];
}

@Injectable({ providedIn: 'root' })
export class BeehiveService {
  private request = inject(RequestService);

  getBeehives(): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<BeehivePayload[]>('beehives').pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(b => this.fromApi(b)) }))
    );
  }

  getBeehivesOfApiary(apiaryId: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<BeehivePayload[]>(`beehives/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: (res.data ?? []).map(b => this.fromApi(b)) }))
    );
  }

  createBeehives(apiaryId: number, count: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.postRequest<Beehive[]>('beehives', { apiary_id: apiaryId, hives_number: count });
  }


  updateBeehive(id: number, data: Partial<Beehive>): Observable<ApiResponse<Beehive>> {
    const payload: { number?: number | null } = {};
    if (data.name !== undefined) payload.number = parseInt(data.name, 10) || null;
    return this.request.putRequest<BeehivePayload>(`beehives/${id}`, payload).pipe(
      map(res => ({ ...res, data: this.fromApi(res.data) }))
    );
  }

  deleteBeehive(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`beehives/${id}`);
  }

  private fromApi(b: BeehivePayload): Beehive {
    return {
      id:       b.id,
      uuid:     b.uuid,
      name:     b.name ?? String(b.number ?? b.id),
      apiaryId: b.apiary_id,
      queen:    b.queen ?? null,
    };
  }
}

