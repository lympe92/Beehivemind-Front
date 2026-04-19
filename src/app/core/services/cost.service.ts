import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { Cost, MonthlyCost, YearCostSum, CostByCategory } from '../models/cost.model';

@Injectable({ providedIn: 'root' })
export class CostService {
  private request = inject(RequestService);

  getCosts(): Observable<ApiResponse<Cost[]>> {
    return this.request.getRequest<Cost[]>('costs');
  }

  createCost(data: Omit<Cost, 'id' | 'category_name'>): Observable<ApiResponse<Cost>> {
    return this.request.postRequest<Cost>('costs', data);
  }

  updateCost(id: number, data: Partial<Omit<Cost, 'id' | 'category_name'>>): Observable<ApiResponse<Cost>> {
    return this.request.putRequest<Cost>(`costs/${id}`, data);
  }

  deleteCost(id: number): Observable<ApiResponse<void>> {
    return this.request.deleteRequest<void>(`costs/${id}`);
  }

  getMonthlyCosts(): Observable<ApiResponse<MonthlyCost[]>> {
    return this.request.getRequest<MonthlyCost[]>('costs/stats/monthly');
  }

  getYearCostSum(): Observable<ApiResponse<YearCostSum[]>> {
    return this.request.getRequest<YearCostSum[]>('costs/stats/yearly');
  }

  getIncomeCostsByCategory(): Observable<ApiResponse<CostByCategory[]>> {
    return this.request.getRequest<CostByCategory[]>('costs/stats/by-category/income');
  }

  getOutcomeCostsByCategory(): Observable<ApiResponse<CostByCategory[]>> {
    return this.request.getRequest<CostByCategory[]>('costs/stats/by-category/outcome');
  }
}
