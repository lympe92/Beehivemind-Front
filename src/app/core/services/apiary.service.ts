import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Apiary } from '../models/apiary.model';

@Injectable({ providedIn: 'root' })
export class ApiaryService {
  private request = inject(RequestService);

  getAllApiaries(): Observable<ApiResponse<Apiary[]>> {
    return this.request.getRequest<any>('apiaries?per_page=all').pipe(
      map(res => {
        const raw: any[] = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
          : [];
        return { ...res, data: raw.map(a => this.fromApi(a)) };
      }),
    );
  }

  getApiaries(page = 1, perPage = 10): Observable<ApiResponse<Apiary[]>> {
    return this.request.getRequest<any>(`apiaries?page=${page}&per_page=${perPage}`).pipe(
      map(res => {
        // Handle both flat array and paginated { data: [], meta: {} } response shapes
        const raw: any[] = Array.isArray(res.data) ? res.data
          : Array.isArray(res.data?.data) ? res.data.data
          : [];
        return { ...res, data: raw.map(a => this.fromApi(a)) };
      }),
    );
  }

  createApiary(apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    // Only map the request — component checks res.success then calls load()
    return this.request.postRequest<any>('apiaries', this.toApi(apiary));
  }

  updateApiary(id: number, apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    return this.request.putRequest<any>(`apiaries/${id}`, this.toApi(apiary));
  }

  deleteApiary(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`apiaries/${id}`);
  }

  // camelCase → snake_case for requests
  private toApi(a: Partial<Apiary>): object {
    return {
      ...(a.name      !== undefined && { name: a.name }),
      ...(a.hivesNumber !== undefined && { hives_number: a.hivesNumber }),
      ...(a.latitude  !== undefined && { latitude: a.latitude }),
      ...(a.longitude !== undefined && { longitude: a.longitude }),
    };
  }

  // snake_case → camelCase for responses
  private fromApi(a: any): Apiary {
    return {
      id:          a.id,
      name:        a.name,
      hivesNumber: a.hives_number ?? a.hivesNumber,
      latitude:    a.latitude,
      longitude:   a.longitude,
    };
  }
}