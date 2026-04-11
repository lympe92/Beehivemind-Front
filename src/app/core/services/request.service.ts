import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from '../../../environments/environment';
import {ApiResponse} from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class RequestService<T = unknown> {

  constructor(
    private http: HttpClient,
  ) {}

  getRequest = <T>(suffix: string, options = {}): Observable<ApiResponse<T>> => {
    return this.http.get<ApiResponse<T>>(environment.apiUrl + suffix, options);
  };

  postRequest = <T>(suffix: string, data = {}): Observable<ApiResponse<T>> => {
    return this.http.post<ApiResponse<T>>(environment.apiUrl + suffix, data);
  };

  putRequest = <T>(suffix: string, data = {}): Observable<ApiResponse<T>> => {
    return this.http.put<ApiResponse<T>>(environment.apiUrl + suffix, data);
  };

  deleteRequest = <T>(suffix: string, data = {}): Observable<ApiResponse<T>> => {
    return this.http.delete<ApiResponse<T>>(environment.apiUrl + suffix, { body: data });
  };

}
