import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Harvest } from '../models/harvest.model';

@Injectable({ providedIn: 'root' })
export class HarvestService {
  private request = inject(RequestService);

  getHarvestOfApiary(apiaryId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<Harvest[]>(`harvest?apiary_id=${apiaryId}`);
  }

  getHarvestOfBeehive(beehiveId: number): Observable<ApiResponse<Harvest[]>> {
    return this.request.getRequest<Harvest[]>(`harvest?beehive_id=${beehiveId}`);
  }

  createHarvest(data: Omit<Harvest, 'id' | 'beehive'> & { beehive_id?: number; apiary_id?: number }): Observable<ApiResponse<Harvest[]>> {
    return this.request.postRequest<Harvest[]>('harvest', data);
  }

  updateHarvest(id: number, data: Partial<Omit<Harvest, 'id' | 'beehive'>>): Observable<ApiResponse<Harvest>> {
    return this.request.putRequest<Harvest>(`harvest/${id}`, data);
  }

  deleteHarvest(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`harvest/${id}`);
  }

  deleteHarvestByApiaryAndDate(apiaryId: number, date: string): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`harvest?apiary_id=${apiaryId}&date=${date}`);
  }
}
