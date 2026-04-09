import { Component, computed, input } from '@angular/core';
import { Inspection } from '../../../../core/models/inspection.model';

export type FilterLevel = 'user' | 'apiary' | 'beehive';

interface DetectionRow {
  no_queen: number | string;
  varroa: number | string;
  american_foulbrood: number | string;
  european_foulbrood: number | string;
  nosema: number | string;
}

@Component({
  selector: 'app-detections-table',
  standalone: true,
  imports: [],
  templateUrl: './detections-table.html',
  styleUrl: './detections-table.scss',
})
export class DetectionsTableComponent {
  readonly inspections = input.required<Inspection[]>();
  readonly filterLevel = input<FilterLevel>('user');

  readonly detections = computed<DetectionRow | null>(() => {
    const data = this.inspections();
    if (!data.length) return null;

    if (this.filterLevel() !== 'beehive') {
      // Aggregate view: latest inspection per beehive
      const latestPerBeehive = this.latestPerBeehive(data);

      return {
        no_queen: latestPerBeehive.filter(v => v.beehive.queen === null).length,
        varroa: latestPerBeehive.filter(v => v.varroa === 1).length,
        american_foulbrood: latestPerBeehive.filter(v => v.american_foulbrood === 1).length,
        european_foulbrood: latestPerBeehive.filter(v => v.european_foulbrood === 1).length,
        nosema: latestPerBeehive.filter(v => v.nosema === 1).length,
      };
    } else {
      // Single beehive view: just the latest inspection
      const latest = data.reduce((prev, curr) =>
        new Date(curr.date) > new Date(prev.date) ? curr : prev
      );

      return {
        no_queen: latest.beehive.queen === null ? 'Yes' : 'No',
        varroa: latest.varroa ? 'Yes' : 'No',
        american_foulbrood: latest.american_foulbrood ? 'Yes' : 'No',
        european_foulbrood: latest.european_foulbrood ? 'Yes' : 'No',
        nosema: latest.nosema ? 'Yes' : 'No',
      };
    }
  });

  private latestPerBeehive(data: Inspection[]): Inspection[] {
    const map = new Map<number, Inspection>();
    for (const insp of data) {
      const existing = map.get(insp.beehive.id);
      if (!existing || new Date(insp.date) > new Date(existing.date)) {
        map.set(insp.beehive.id, insp);
      }
    }
    return [...map.values()];
  }
}
