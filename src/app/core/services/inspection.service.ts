import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { AvgInspection, Inspection } from '../models/inspection.model';

/** Raw inspection record payload as returned by the API (snake_case). */
interface InspectionPayload {
  id: number;
  date: Inspection['date'];
  beehive_id: number;
  population: Inspection['population'];
  frame_space: Inspection['frame_space'];
  pollen: Inspection['pollen'];
  honey: Inspection['honey'];
  opened_brood: Inspection['opened_brood'];
  closed_brood: Inspection['closed_brood'];
  varroa: Inspection['varroa'];
  american_foulbrood: Inspection['american_foulbrood'];
  european_foulbrood: Inspection['european_foulbrood'];
  nosema: Inspection['nosema'];
  queen_exists: Inspection['queen_exists'];
  queen_cells: Inspection['queen_cells'];
  queen_year: Inspection['queen_year'];
}

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private request = inject(RequestService);

  getAllInspections(): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<InspectionPayload[]>('inspections').pipe(
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
    return this.request.getRequest<InspectionPayload[]>(`inspections/apiary/${apiaryId}`).pipe(
      map(res => ({ ...res, data: res.data.map(this.fromApi) }))
    );
  }

  getAvgInspectionsOfApiary(apiaryId: number): Observable<ApiResponse<AvgInspection[]>> {
    return this.request.getRequest<AvgInspection[]>(`inspections/apiary/${apiaryId}/avg`);
  }

  getInspectionsOfBeehive(beehiveId: number): Observable<ApiResponse<Inspection[]>> {
    return this.request.getRequest<InspectionPayload[]>(`inspections/beehive/${beehiveId}`).pipe(
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

  private fromApi = (r: InspectionPayload): Inspection => ({
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
