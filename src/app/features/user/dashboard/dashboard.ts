import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ApexOptions } from 'ngx-apexcharts';
import { AvgInspection, Inspection } from '../../../core/models/inspection.model';
import { InspectionService } from '../../../core/services/inspection.service';
import { Store } from '@ngrx/store';
import { ApiariesActions } from '../../../store/apiaries/apiaries.actions';
import { selectAllApiaries } from '../../../store/apiaries/apiaries.selectors';
import { BeehivesActions } from '../../../store/beehives/beehives.actions';
import { selectAllBeehives } from '../../../store/beehives/beehives.selectors';
import { InspectionsActions } from '../../../store/inspections/inspections.actions';
import { selectAllInspections } from '../../../store/inspections/inspections.selectors';
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
  private store = inject(Store);
  private inspectionService = inject(InspectionService);
  private chartBuilder = inject(ChartBuilderService);

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allInspections = this.store.selectSignal(selectAllInspections);

  // chartInspections: avg (user/apiary) or raw (beehive) — drives line/bar/brood charts
  chartInspections = signal<AvgInspection[]>([]);

  filterLevel = signal<FilterLevel>('user');
  selectedApiaryId = signal<number | null>(null);
  selectedBeehiveId = signal<number | null>(null);

  // rawInspections: computed from store, filtered by current level — drives queens pie + detections table
  rawInspections = computed<Inspection[]>(() => {
    const all = this.allInspections();
    const level = this.filterLevel();
    const apiaryId = this.selectedApiaryId();
    const beehiveId = this.selectedBeehiveId();

    if (level === 'beehive' && beehiveId !== null) {
      return all.filter(r => r.beehiveId === beehiveId);
    }
    if (level === 'apiary' && apiaryId !== null) {
      const ids = new Set(this.allBeehives().filter(b => b.apiaryId === apiaryId).map(b => b.id));
      return all.filter(r => ids.has(r.beehiveId));
    }
    return all;
  });

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

    const latestPerBeehive = new Map<number, Inspection>();
    for (const insp of raw) {
      const existing = latestPerBeehive.get(insp.beehiveId);
      if (!existing || new Date(insp.date) > new Date(existing.date)) {
        latestPerBeehive.set(insp.beehiveId, insp);
      }
    }

    const yearCounts = new Map<number, number>();
    for (const insp of latestPerBeehive.values()) {
      if (insp.queen_year) {
        yearCounts.set(insp.queen_year, (yearCounts.get(insp.queen_year) ?? 0) + 1);
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
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(InspectionsActions.load());
    this.loadAvgData();
  }

  // ── Filter handlers ─────────────────────────────────────

  onApiaryChange(apiaryId: number): void {
    if (apiaryId === 0) {
      this.filterLevel.set('user');
      this.selectedApiaryId.set(null);
      this.selectedBeehiveId.set(null);
      this.loadAvgData();
    } else {
      this.filterLevel.set('apiary');
      this.selectedApiaryId.set(apiaryId);
      this.selectedBeehiveId.set(null);
      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    if (beehiveId === 0) {
      this.filterLevel.set('apiary');
      this.selectedBeehiveId.set(null);
      const apiaryId = this.selectedApiaryId()!;
      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
      });
    } else {
      this.filterLevel.set('beehive');
      this.selectedBeehiveId.set(beehiveId);
      this.inspectionService.getInspectionsOfBeehive(beehiveId).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
      });
    }
  }

  // ── Private ─────────────────────────────────────────────

  private loadAvgData(): void {
    this.inspectionService.getAvgInspectionsOfUser().subscribe(res => {
      if (res.success) this.chartInspections.set(res.data);
    });
  }
}
