import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../../core/models/apiary.model';
import { Beehive } from '../../../../core/models/beehive.model';
import { BeehiveService } from '../../../../core/services/beehive.service';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class DashboardFiltersComponent {
  private beehiveService = inject(BeehiveService);

  readonly apiaries = input.required<Apiary[]>();

  readonly apiaryChange = output<number>();
  readonly beehiveChange = output<number>();

  beehives = signal<Beehive[]>([]);
  selectedApiary = 0;
  selectedBeehive = 0;

  onApiaryChange(apiaryId: number): void {
    this.selectedBeehive = 0;
    this.beehives.set([]);
    this.apiaryChange.emit(apiaryId);

    if (apiaryId !== 0) {
      this.beehiveService.getBeehivesOfApiary(apiaryId).subscribe(res => {
        if (res.success) this.beehives.set(res.data);
      });
    }
  }

  onBeehiveChange(beehiveId: number): void {
    this.beehiveChange.emit(beehiveId);
  }
}