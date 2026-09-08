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

/** The design system draws the last seven months, ending with the current one. */
const CHART_MONTHS = 7;

@Component({
  selector: 'app-financial',
  standalone: true,
  imports: [ApexChartComponent, CardComponent, CostCategoriesComponent, CostsComponent],
  templateUrl: './financial.html',
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

    // The API returns the last twelve months keyed by month number only, so a
    // window ending at the current month is the one reading that is never
    // ambiguous; the kit shows seven columns.
    const now = new Date();
    const window = Array.from({ length: CHART_MONTHS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (CHART_MONTHS - 1) + i, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });
    const crossesYear = window[0].year !== window[window.length - 1].year;

    const income = window.map(() => 0);
    const outcome = window.map(() => 0);
    for (const item of data) {
      const idx = window.findIndex(w => w.month === Number(item.month));
      if (idx === -1) continue;
      if (item.type === 'income') income[idx] = Number(item.amount);
      else outcome[idx] = Number(item.amount);
    }

    return this.chartBuilder.bar({
      series: [
        { name: 'Income', data: income },
        { name: 'Outgoing', data: outcome },
      ],
      categories: window.map(w => MONTHS[w.month - 1] + (crossesYear ? ' ' + String(w.year).slice(2) : '')),
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