import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { CostCategory } from '../models/cost-category.model';

@Injectable({ providedIn: 'root' })
export class CostCategoryService {
  private request = inject(RequestService);

  getCategories(): Observable<ApiResponse<CostCategory[]>> {
    return this.request.getRequest<CostCategory[]>('cost-categories');
  }

  createCategory(data: Omit<CostCategory, 'id'>): Observable<ApiResponse<CostCategory>> {
    return this.request.postRequest<CostCategory>('cost-categories', data);
  }

  updateCategory(id: number, data: Partial<Omit<CostCategory, 'id'>>): Observable<ApiResponse<CostCategory>> {
    return this.request.putRequest<CostCategory>(`cost-categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`cost-categories/${id}`);
  }
}
