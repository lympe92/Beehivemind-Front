import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private http = inject(HttpClient);

  getRequest<T>(suffix: string, options = {}): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(environment.apiUrl + suffix, options);
  }

  /** `context` carries per-request flags for the interceptors, e.g. `inlineErrors()`. */
  postRequest<T>(suffix: string, data = {}, options: { context?: HttpContext } = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(environment.apiUrl + suffix, data, options);
  }

  putRequest<T>(suffix: string, data = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(environment.apiUrl + suffix, data);
  }

  patchRequest<T>(suffix: string, data = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(environment.apiUrl + suffix, data);
  }

  deleteRequest<T>(suffix: string, data = {}): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(environment.apiUrl + suffix, { body: data });
  }

  /** A file the API answers with directly (exports), not an `ApiResponse`. */
  getBlobRequest(suffix: string, params: Record<string, string | number> = {}): Observable<Blob> {
    return this.http.get(environment.apiUrl + suffix, {
      params: new HttpParams({ fromObject: params }),
      responseType: 'blob',
    });
  }

  postBlobRequest(suffix: string, data = {}): Observable<Blob> {
    return this.http.post(environment.apiUrl + suffix, data, { responseType: 'blob' });
  }
}
