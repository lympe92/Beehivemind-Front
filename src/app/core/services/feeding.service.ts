import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Feeding } from '../models/feeding.model';

@Injectable({ providedIn: 'root' })
export class FeedingService {
  private request = inject(RequestService);

  getFeedingOfApiary(apiaryId: number): Observable<ApiResponse<Feeding[]>> {
    return this.request.getRequest<Feeding[]>(`feeding?apiary_id=${apiaryId}`);
  }

  getFeedingOfBeehive(beehiveId: number): Observable<ApiResponse<Feeding[]>> {
    return this.request.getRequest<Feeding[]>(`feeding?beehive_id=${beehiveId}`);
  }

  createFeeding(data: Omit<Feeding, 'id' | 'beehive'> & { beehive_id?: number; apiary_id?: number }): Observable<ApiResponse<Feeding[]>> {
    return this.request.postRequest<Feeding[]>('feeding', data);
  }

  updateFeeding(id: number, data: Partial<Omit<Feeding, 'id' | 'beehive'>>): Observable<ApiResponse<Feeding>> {
    return this.request.putRequest<Feeding>(`feeding/${id}`, data);
  }

  deleteFeeding(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`feeding/${id}`);
  }
}
