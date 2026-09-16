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
    return this.request.postRequest<Cost>('costs', this.toApi(data));
  }

  updateCost(id: number, data: Partial<Omit<Cost, 'id' | 'category_name'>>): Observable<ApiResponse<Cost>> {
    return this.request.putRequest<Cost>(`costs/${id}`, this.toApi(data));
  }

  /**
   * The API reads a cost back as `category_id` but writes it as
   * `cost_category_id`, so a payload echoing what was read is refused — which
   * is what made every new cost fail with "Validation failed".
   */
  private toApi(data: Partial<Omit<Cost, 'id' | 'category_name'>>): Record<string, unknown> {
    const { category_id, ...rest } = data;

    return category_id === undefined ? { ...rest } : { ...rest, cost_category_id: category_id };
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
