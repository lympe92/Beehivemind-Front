import { Component, computed, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { FilterBarComponent } from '../../../shared/components/ui/filter-bar/filter-bar';
import { CardComponent } from '../../../shared/components/ui/card/card';

export type FilterLevel = 'user' | 'apiary' | 'beehive';

interface DetectionRow {
  no_queen: number | string;
  varroa: number | string;
  american_foulbrood: number | string;
  european_foulbrood: number | string;
  nosema: number | string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [ApexChartComponent, FilterBarComponent, CardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class UserDashboardComponent implements OnInit {
  private store = inject(Store);
  private inspectionService = inject(InspectionService);
  private chartBuilder = inject(ChartBuilderService);
  private destroyRef = inject(DestroyRef);

  apiaries = this.store.selectSignal(selectAllApiaries);
  private allBeehives = this.store.selectSignal(selectAllBeehives);
  private allInspections = this.store.selectSignal(selectAllInspections);

  chartInspections = signal<AvgInspection[]>([]);
  chartLoading = signal(true);

  filterLevel = signal<FilterLevel>('user');
  selectedApiaryId = signal<number | null>(null);
  selectedBeehiveId = signal<number | null>(null);

  filteredBeehives = computed(() => {
    const apiaryId = this.selectedApiaryId();
    if (!apiaryId) return [];
    return this.allBeehives().filter(b => b.apiaryId === apiaryId);
  });

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

  detections = computed<DetectionRow | null>(() => {
    const data = this.rawInspections();
    if (!data.length) return null;

    if (this.filterLevel() !== 'beehive') {
      const latest = this.latestPerBeehive(data);
      return {
        no_queen:           latest.filter(v => !v.queen_exists).length,
        varroa:             latest.filter(v => !!v.varroa).length,
        american_foulbrood: latest.filter(v => !!v.american_foulbrood).length,
        european_foulbrood: latest.filter(v => !!v.european_foulbrood).length,
        nosema:             latest.filter(v => !!v.nosema).length,
      };
    }

    const latest = data.reduce((prev, curr) =>
      new Date(curr.date) > new Date(prev.date) ? curr : prev
    );
    return {
      no_queen:           !latest.queen_exists      ? 'Yes' : 'No',
      varroa:             !!latest.varroa           ? 'Yes' : 'No',
      american_foulbrood: !!latest.american_foulbrood ? 'Yes' : 'No',
      european_foulbrood: !!latest.european_foulbrood ? 'Yes' : 'No',
      nosema:             !!latest.nosema           ? 'Yes' : 'No',
    };
  });

  // ── Computed chart options ──────────────────────────────

  variablesLineOptions = computed<ApexOptions | null>(() => {
    const data = this.chartInspections();
    if (!data.length) return null;
    return this.chartBuilder.line({
      series: [
        { name: 'Pollen',       data: data.map(v => v.pollen) },
        { name: 'Honey',        data: data.map(v => v.honey) },
        { name: 'Open Brood',   data: data.map(v => v.opened_brood) },
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
        { name: 'Frames',     data: data.map(v => v.frame_space) },
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

    const yearCounts = new Map<number, number>();
    for (const insp of this.latestPerBeehive(raw)) {
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
      this.chartLoading.set(true);
      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
        this.chartLoading.set(false);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    if (beehiveId === 0) {
      this.filterLevel.set('apiary');
      this.selectedBeehiveId.set(null);
      const apiaryId = this.selectedApiaryId()!;
      this.chartLoading.set(true);
      this.inspectionService.getAvgInspectionsOfApiary(apiaryId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
        this.chartLoading.set(false);
      });
    } else {
      this.filterLevel.set('beehive');
      this.selectedBeehiveId.set(beehiveId);
      this.chartLoading.set(true);
      this.inspectionService.getInspectionsOfBeehive(beehiveId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
        if (res.success) this.chartInspections.set(res.data);
        this.chartLoading.set(false);
      });
    }
  }

  // ── Private ─────────────────────────────────────────────

  private loadAvgData(): void {
    this.chartLoading.set(true);
    this.inspectionService.getAvgInspectionsOfUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res.success) this.chartInspections.set(res.data);
      this.chartLoading.set(false);
    });
  }

  private latestPerBeehive(data: Inspection[]): Inspection[] {
    const map = new Map<number, Inspection>();
    for (const insp of data) {
      const existing = map.get(insp.beehiveId);
      if (!existing || new Date(insp.date) > new Date(existing.date)) {
        map.set(insp.beehiveId, insp);
      }
    }
    return [...map.values()];
  }
}
