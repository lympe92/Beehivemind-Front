import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Apiary } from '../models/apiary.model';

@Injectable({ providedIn: 'root' })
export class ApiaryService {
  private request = inject(RequestService);

  getApiaries(): Observable<ApiResponse<Apiary[]>> {
    return this.request.getRequest<Apiary[]>('apiaries');
  }

  createApiary(apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    return this.request.postRequest<Apiary>('apiaries', apiary);
  }

  updateApiary(id: number, apiary: Partial<Apiary>): Observable<ApiResponse<Apiary>> {
    return this.request.putRequest<Apiary>(`apiaries/${id}`, apiary);
  }

  deleteApiary(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`apiaries/${id}`);
  }
}