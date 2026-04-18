import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { AvgInspection, Inspection } from '../models/inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private request = inject(RequestService);

  getAllInspections(): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<any[]>('inspections').pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getInspectionsOfUser(): Observable<ApiResponse<Inspection[]>> {
    return this.getAllInspections();
  }

  getAvgInspectionsOfUser(): Observable<ApiResponse<AvgInspection[]>> {
    return this.request.getRequest<AvgInspection[]>('inspections/avg');
  }

  getInspectionsOfApiary(apiaryId: number): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<any[]>(`inspections/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getAvgInspectionsOfApiary(apiaryId: number): Observable<ApiResponse<AvgInspection[]>> {
    return this.request.getRequest<AvgInspection[]>(`inspections/apiary/${apiaryId}/avg`);
  }

  getInspectionsOfBeehive(beehiveId: number): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<any[]>(`inspections/beehive/${beehiveId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  createInspection(data: Omit<Inspection, 'id' | 'beehiveId'> & { beehive_id: number }): Observable<ApiResponse<Inspection>> {
    return this.request.postRequest<Inspection>('records', { ...data, type: 'inspection' });
  }

  updateInspection(id: number, data: Partial<Omit<Inspection, 'id' | 'beehiveId'>>): Observable<ApiResponse<Inspection>> {
    return this.request.putRequest<Inspection>(`records/${id}`, data);
  }

  deleteInspection(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`records/${id}`);
  }

  private fromApi = (r: any): Inspection => ({
    id: r.id,
    date: r.date,
    beehiveId: r.beehive_id,
    population: r.population,
    frame_space: r.frame_space,
    pollen: r.pollen,
    honey: r.honey,
    opened_brood: r.opened_brood,
    closed_brood: r.closed_brood,
    varroa: r.varroa,
    american_foulbrood: r.american_foulbrood,
    european_foulbrood: r.european_foulbrood,
    nosema: r.nosema,
    queen_exists: r.queen_exists,
    queen_cells: r.queen_cells,
    queen_year: r.queen_year,
  });
}
