import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Beehive } from '../models/beehive.model';

@Injectable({ providedIn: 'root' })
export class BeehiveService {
  private request = inject(RequestService);

  getBeehives(): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<Beehive[]>('beehives');
  }

  getBeehivesOfApiary(apiaryId: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.getRequest<Beehive[]>(`beehives?apiary_id=${apiaryId}`);
  }

  createBeehives(apiaryId: number, count: number): Observable<ApiResponse<Beehive[]>> {
    return this.request.postRequest<Beehive[]>('beehives', { apiary_id: apiaryId, count });
  }

  updateBeehive(id: number, data: Partial<Beehive>): Observable<ApiResponse<Beehive>> {
    return this.request.putRequest<Beehive>(`beehives/${id}`, data);
  }

  deleteBeehive(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`beehives/${id}`);
  }
}
