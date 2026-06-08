import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Harvest } from '../models/harvest.model';

/** Raw harvest record payload as returned by the API (snake_case). */
interface HarvestPayload {
  id: number;
  date: Harvest['date'];
  honey_type: Harvest['honey_type'];
  honey_description?: Harvest['honey_description'];
  food_quantity: Harvest['food_quantity'];
  unit: Harvest['unit'];
  beehive_id: number;
}

@Injectable({ providedIn: 'root' })
export class HarvestService {
  private request = inject(RequestService);

  getAllHarvest(): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<HarvestPayload[]>('harvest').pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getHarvestOfApiary(apiaryId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<HarvestPayload[]>(`harvest/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getHarvestOfBeehive(beehiveId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<HarvestPayload[]>(`harvest/beehive/${beehiveId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  createHarvest(data: Omit<Harvest, 'id' | 'beehiveId'> & { beehive_id?: number; apiary_id?: number }): Observable<ApiResponse<Harvest[]>> {
    const { apiary_id, ...rest } = data;
    if (apiary_id) {
      return this.request.postRequest<Harvest[]>(`records/apiary/${apiary_id}`, { ...rest, type: 'harvest' });
    }
    return this.request.postRequest<Harvest[]>('records', { ...rest, type: 'harvest' });
  }

  updateHarvest(id: number, data: Partial<Omit<Harvest, 'id' | 'beehiveId'>>): Observable<ApiResponse<Harvest>> {
    return this.request.putRequest<Harvest>(`records/${id}`, data);
  }

  deleteHarvest(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`records/${id}`);
  }

  deleteHarvestByApiaryAndDate(apiaryId: number, date: string): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`records/apiary/${apiaryId}/${date}`);
  }

  private fromApi = (r: HarvestPayload): Harvest => ({
    id: r.id,
    date: r.date,
    honey_type: r.honey_type,
    honey_description: r.honey_description ?? '',
    food_quantity: r.food_quantity,
    unit: r.unit,
    beehiveId: r.beehive_id,
  });
}
