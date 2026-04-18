import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Harvest } from '../models/harvest.model';

@Injectable({ providedIn: 'root' })
export class HarvestService {
  private request = inject(RequestService);

  getAllHarvest(): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<any[]>('harvest').pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getHarvestOfApiary(apiaryId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<any[]>(`harvest/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getHarvestOfBeehive(beehiveId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<any[]>(`harvest/beehive/${beehiveId}`).pipe(
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

  private fromApi = (r: any): Harvest => ({
    id: r.id,
    date: r.date,
    honey_type: r.honey_type,
    honey_description: r.honey_description ?? '',
    food_quantity: r.food_quantity,
    unit: r.unit,
    beehiveId: r.beehive_id,
  });
}
