import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApexOptions } from 'ngx-apexcharts';
import { Apiary } from '../../../core/models/apiary.model';
import { AvgInspection, Inspection } from '../../../core/models/inspection.model';
import { ApiaryService } from '../../../core/services/apiary.service';
import { InspectionService } from '../../../core/services/inspection.service';
import { ChartBuilderService } from '../../../core/services/chart-builder.service';
import { ApexChartComponent } from '../../../shared/components/ui/apex-chart/apex-chart';
import { DashboardFiltersComponent } from './filters/filters';
import { DetectionsTableComponent, FilterLevel } from './detections-table/detections-table';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [ApexChartComponent, DashboardFiltersComponent, DetectionsTableComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class UserDashboardComponent implements OnInit {
  private apiaryService = inject(ApiaryService);
  private inspectionService = inject(InspectionService);
  private chartBuilder = inject(ChartBuilderService);

  apiaries = signal<Apiary[]>([]);

  // chartInspections: avg (user/apiary) or raw (beehive) — drives line/bar/brood charts
  chartInspections = signal<AvgInspection[]>([]);

  // rawInspections: raw per-inspection data — drives queens pie + detections table
  rawInspections = signal<Inspection[]>([]);

  filterLevel = signal<FilterLevel>('user');
  selectedApiaryId = signal<number | null>(null);

  // ── Computed chart options ──────────────────────────────

  variablesLineOptions = computed<ApexOptions | null>(() => {
    const data = this.chartInspections();
    if (!data.length) return null;
    return this.chartBuilder.line({
      series: [
        { name: 'Pollen', data: data.map(v => v.pollen) },
        { name: 'Honey', data: data.map(v => v.honey) },
        { name: 'Open Brood', data: data.map(v => v.opened_brood) },
        { name: 'Closed Brood', data: data.map(v => v.closed_brood) },
      ],
      categories: data.map(v => v.date),
    });
  });

  populationLineOptions = computed<ApexOptions | null>(() => {
    const data = this.chartInspections();
    if (!data.length) return null;
    return this.chartBuilder.line({
      series: [
        { name: 'Population', data: data.map(v => v.population) },
        { name: 'Frames', data: data.map(v => v.frame_space) },
      ],
      categories: data.map(v => v.date),
    });
  });

  lastInspectionBarOptions = computed<ApexOptions | null>(() => {
    const data = this.chartInspections();
    if (!data.length) return null;
    const last = data[data.length - 1];
    return this.chartBuilder.bar({
      series: [{ name: 'Value', data: [last.population, last.pollen, last.honey, last.opened_brood, last.closed_brood] }],
      categories: ['Population', 'Pollen', 'Honey', 'Open Brood', 'Closed Brood'],
    });
  });

  broodPieOptions = computed<ApexOptions | null>(() => {
    const data = this.chartInspections();
    if (!data.length) return null;
    const last = data[data.length - 1];
    return this.chartBuilder.pie({
      values: [last.opened_brood, last.closed_brood],
      labels: ['Opened Brood', 'Closed Brood'],
    });
  });

  queensPieOptions = computed<ApexOptions | null>(() => {
    const raw = this.rawInspections();
    if (!raw.length) return null;

    // Get the latest inspection per beehive
    const latestPerBeehive = new Map<number, Inspection>();
    for (const insp of raw) {
      const existing = latestPerBeehive.get(insp.beehive.id);
      if (!existing || new Date(insp.date) > new Date(existing.date)) {
        latestPerBeehive.set(insp.beehive.id, insp);
      }
    }

    // Count queens by year (dynamic — no hardcoded years)
    const yearCounts = new Map<number, number>();
    for (const insp of latestPerBeehive.values()) {
      if (insp.beehive.queen) {
        const year = insp.beehive.queen.year;
        yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
      }
    }

    if (!yearCounts.size) return null;

    const sorted = [...yearCounts.entries()].sort(([a], [b]) => a - b);
    return this.chartBuilder.pie({
      values: sorted.map(([, count]) => count),
      labels: sorted.map(([year]) => String(year)),
    });
  });

  // ── Lifecycle ───────────────────────────────────────────

  ngOnInit(): void {
    this.apiaryService.getApiaries().subscribe(res => {
      if (res.success) this.apiaries.set(res.data);
    });
    this.loadUserData();
  }

  // ── Filter handlers ─────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    if (apiaryId === 0) {
      this.filterLevel.set('user');
      this.selectedApiaryId.set(null);
      this.loadUserData();
    } else {
      this.filterLevel.set('apiary');
      this.selectedApiaryId.set(apiaryId);

      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
      });
      this.inspectionService.getInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.rawInspections.set(res.data);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    if (beehiveId === 0) {
      // Back to apiary level
      this.filterLevel.set('apiary');
      const apiaryId = this.selectedApiaryId()!;
      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
      });
      this.inspectionService.getInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.rawInspections.set(res.data);
      });
    } else {
      this.filterLevel.set('beehive');
      this.inspectionService.getInspectionsOfBeehive(beehiveId).subscribe(res => {
        if (res.success) {
          this.chartInspections.set(res.data);
          this.rawInspections.set(res.data);
        }
      });
    }
  }

  // ── Private ─────────────────────────────────────────────

  private loadUserData(): void {
    this.inspectionService.getAvgInspectionsOfUser().subscribe(res => {
      if (res.success) this.chartInspections.set(res.data);
    });
    this.inspectionService.getInspectionsOfUser().subscribe(res => {
      if (res.success) this.rawInspections.set(res.data);
    });
  }
}
