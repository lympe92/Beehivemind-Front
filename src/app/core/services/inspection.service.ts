import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { AvgInspection, Inspection } from '../models/inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private request = inject(RequestService);

  getInspectionsOfUser(): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<Inspection[]>('inspections');
  }

  getAvgInspectionsOfUser(): Observable<ApiResponse<AvgInspection[]>> {
    return this.request.getRequest<AvgInspection[]>('inspections/avg');
  }

  getInspectionsOfApiary(apiaryId: number): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<Inspection[]>(`inspections?apiary_id=${apiaryId}`);
  }

  getAvgInspectionsOfApiary(apiaryId: number): Observable<ApiResponse<AvgInspection[]>> {
    return this.request.getRequest<AvgInspection[]>(`inspections/avg?apiary_id=${apiaryId}`);
  }

  getInspectionsOfBeehive(beehiveId: number): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<Inspection[]>(`inspections?beehive_id=${beehiveId}`);
  }

  createInspection(data: Omit<Inspection, 'id' | 'beehive'> & { beehive_id: number }): Observable<ApiResponse<Inspection>> {
    return this.request.postRequest<Inspection>('inspections', data);
  }

  updateInspection(id: number, data: Partial<Omit<Inspection, 'id' | 'beehive'>>): Observable<ApiResponse<Inspection>> {
    return this.request.putRequest<Inspection>(`inspections/${id}`, data);
  }

  deleteInspection(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`inspections/${id}`);
  }
}
