import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Feeding } from '../models/feeding.model';

/** Raw feeding record payload as returned by the API (snake_case). */
interface FeedingPayload {
  id: number;
  date: Feeding['date'];
  feeding_type: Feeding['feeding_type'];
  food_type: Feeding['food_type'];
  food_quantity: Feeding['food_quantity'];
  unit: Feeding['unit'];
  beehive_id: number;
}

@Injectable({ providedIn: 'root' })
export class FeedingService {
  private request = inject(RequestService);

  getAllFeeding(): Observable<ApiResponse<Feeding[]>> {
    return this.request.getRequest<FeedingPayload[]>('feeding').pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getFeedingOfApiary(apiaryId: number): Observable<ApiResponse<Feeding[]>> {
    return this.request.getRequest<FeedingPayload[]>(`feeding/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getFeedingOfBeehive(beehiveId: number): Observable<ApiResponse<Feeding[]>> {
    return this.request.getRequest<FeedingPayload[]>(`feeding/beehive/${beehiveId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  createFeeding(data: Omit<Feeding, 'id' | 'beehiveId'> & { beehive_id?: number; apiary_id?: number }): Observable<ApiResponse<Feeding[]>> {
    const { apiary_id, ...rest } = data;
    if (apiary_id) {
      return this.request.postRequest<Feeding[]>(`records/apiary/${apiary_id}`, { ...rest, type: 'feeding' });
    }
    return this.request.postRequest<Feeding[]>('records', { ...rest, type: 'feeding' });
  }

  updateFeeding(id: number, data: Partial<Omit<Feeding, 'id' | 'beehiveId'>>): Observable<ApiResponse<Feeding>> {
    return this.request.putRequest<Feeding>(`records/${id}`, data);
  }

  deleteFeeding(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`records/${id}`);
  }

  private fromApi = (r: FeedingPayload): Feeding => ({
    id: r.id,
    date: r.date,
    feeding_type: r.feeding_type,
    food_type: r.food_type,
    food_quantity: r.food_quantity,
    unit: r.unit,
    beehiveId: r.beehive_id,
  });
}
