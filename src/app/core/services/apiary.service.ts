import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Apiary } from '../models/apiary.model';

/** Raw apiary payload as returned by the API (snake_case). */
interface ApiaryPayload {
  id: number;
  name: string;
  hives_number?: number;
  hivesNumber?: number;
  latitude: number;
  longitude: number;
  location?: string | null;
  date_established?: string | null;
  last_visited?: string | null;
}

/** List endpoints may return a flat array or a paginated `{ data: [], meta }` envelope. */
type ApiaryListPayload = ApiaryPayload[] | { data: ApiaryPayload[] };

@Injectable({ providedIn: 'root' })
export class ApiaryService {
  private request = inject(RequestService);

  getAllApiaries(): Observable<ApiResponse<Apiary[]>> {
    return this.request.getRequest<ApiaryListPayload>('apiaries?per_page=all').pipe(
      map((res) => ({ ...res, data: this.extractList(res.data).map((a) => this.fromApi(a)) })),
    );
  }

  getApiaries(page = 1, perPage = 10): Observable<ApiResponse<Apiary[]>> {
    return this.request
      .getRequest<ApiaryListPayload>(`apiaries?page=${page}&per_page=${perPage}`)
      .pipe(
        map((res) => ({ ...res, data: this.extractList(res.data).map((a) => this.fromApi(a)) })),
      );
  }

  createApiary(apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    // Only map the request — component checks res.success then calls load()
    return this.request.postRequest<Apiary>('apiaries', this.toApi(apiary));
  }

  updateApiary(id: number, apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    return this.request.putRequest<Apiary>(`apiaries/${id}`, this.toApi(apiary));
  }

  deleteApiary(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`apiaries/${id}`);
  }

  getApiary(id: number): Observable<ApiResponse<Apiary>> {
    return this.request
      .getRequest<ApiaryPayload>(`apiaries/${id}`)
      .pipe(map((res) => ({ ...res, data: this.fromApi(res.data) })));
  }

  // Handle both flat array and paginated { data: [], meta: {} } response shapes
  private extractList(data: ApiaryListPayload): ApiaryPayload[] {
    return Array.isArray(data) ? data : (data?.data ?? []);
  }

  // camelCase → snake_case for requests
  private toApi(a: Partial<Apiary>): Partial<ApiaryPayload> {
    return {
      ...(a.name !== undefined && { name: a.name }),
      ...(a.hivesNumber !== undefined && { hives_number: a.hivesNumber }),
      ...(a.latitude !== undefined && { latitude: a.latitude }),
      ...(a.longitude !== undefined && { longitude: a.longitude }),
      ...(a.location !== undefined && { location: a.location }),
      ...(a.dateEstablished !== undefined && { date_established: a.dateEstablished }),
    };
  }

  // snake_case → camelCase for responses
  fromApi(a: ApiaryPayload): Apiary {
    return {
      id: a.id,
      name: a.name,
      hivesNumber: a.hives_number ?? a.hivesNumber ?? 0,
      latitude: a.latitude,
      longitude: a.longitude,
      location: a.location ?? null,
      dateEstablished: a.date_established ?? null,
      lastVisited: a.last_visited ?? null,
    };
  }
}
