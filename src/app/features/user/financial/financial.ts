import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { ApexOptions } from 'ngx-apexcharts';
import { CostCategory } from '../../../core/models/cost-category.model';
import { CostByCategory, MonthlyCost, YearCostSum } from '../../../core/models/cost.model';
import { CostCategoryService } from '../../../core/services/cost-category.service';
import { CostService } from '../../../core/services/cost.service';
import { ChartBuilderService } from '../../../core/services/chart-builder.service';
import { ApexChartComponent } from '../../../shared/components/ui/apex-chart/apex-chart';
import { CardComponent } from '../../../shared/components/ui/card/card';
import { CostCategoriesComponent } from '../cost-categories/cost-categories';
import { CostsComponent } from '../costs/costs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [ApexChartComponent, CardComponent, CostCategoriesComponent, CostsComponent],
  templateUrl: './financial.html',
  styleUrl: './financial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialComponent implements OnInit {
  private costCategoryService = inject(CostCategoryService);
  private costService = inject(CostService);
  private chartBuilder = inject(ChartBuilderService);

  // Data for sub-components
  costCategories = signal<CostCategory[]>([]);

  // Chart data
  chartsLoading = signal(true);
  monthlyCosts = signal<MonthlyCost[]>([]);
  yearSum = signal<YearCostSum[]>([]);
  incomeCosts = signal<CostByCategory[]>([]);
  outcomeCosts = signal<CostByCategory[]>([]);

  // ── Computed chart options ──────────────────────────────

  monthlyBarOptions = computed<ApexOptions | null>(() => {
    const data = this.monthlyCosts();
    if (!data.length) return null;

    const income = Array<number>(12).fill(0);
    const outcome = Array<number>(12).fill(0);
    for (const item of data) {
      if (item.type === 'income') income[item.month - 1] = Number(item.amount);
      else outcome[item.month - 1] = Number(item.amount);
    }

    return this.chartBuilder.bar({
      series: [
        { name: 'Income', data: income },
        { name: 'Outgoing', data: outcome },
      ],
      categories: MONTHS,
    });
  });

  summaryPieOptions = computed<ApexOptions | null>(() => {
    const data = this.yearSum();
    if (!data.length) return null;
    const income = data.filter(c => c.type === 'income').reduce((s, c) => s + Number(c.amount), 0);
    const outcome = data.filter(c => c.type === 'outcome').reduce((s, c) => s + Number(c.amount), 0);
    if (!income && !outcome) return null;
    return this.chartBuilder.pie({ values: [income, outcome], labels: ['Income', 'Outgoing'] });
  });

  incomePieOptions = computed<ApexOptions | null>(() => {
    const data = this.incomeCosts();
    if (!data.length) return null;
    return this.chartBuilder.pie({
      values: data.map(c => Number(c.amount)),
      labels: data.map(c => c.category),
    });
  });

  outcomePieOptions = computed<ApexOptions | null>(() => {
    const data = this.outcomeCosts();
    if (!data.length) return null;
    return this.chartBuilder.pie({
      values: data.map(c => Number(c.amount)),
      labels: data.map(c => c.category),
    });
  });

  // ── Lifecycle ────────────────────────────────────────────

  ngOnInit(): void {
    this.costCategoryService.getCategories().subscribe(res => {
      if (res.success) this.costCategories.set(res.data);
    });
    this.loadCharts();
  }

  // ── Event handlers ───────────────────────────────────────

  onCategoriesChange(categories: CostCategory[]): void {
    this.costCategories.set(categories);
  }

  onCostsChange(): void {
    this.loadCharts();
  }

  // ── Private ──────────────────────────────────────────────

  private loadCharts(): void {
    this.chartsLoading.set(true);

    // Each request fails independently — one error doesn't drop the other charts.
    forkJoin({
      monthly: this.costService.getMonthlyCosts().pipe(catchError(() => of(null))),
      yearSum: this.costService.getYearCostSum().pipe(catchError(() => of(null))),
      income: this.costService.getIncomeCostsByCategory().pipe(catchError(() => of(null))),
      outcome: this.costService.getOutcomeCostsByCategory().pipe(catchError(() => of(null))),
    }).subscribe(({ monthly, yearSum, income, outcome }) => {
      if (monthly?.success) this.monthlyCosts.set(monthly.data);
      if (yearSum?.success) this.yearSum.set(yearSum.data);
      if (income?.success) this.incomeCosts.set(income.data);
      if (outcome?.success) this.outcomeCosts.set(outcome.data);
      this.chartsLoading.set(false);
    });
  }
}