import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Apiary } from '../../../../core/models/apiary.model';
import { selectAllBeehives } from '../../../../store/beehives/beehives.selectors';

@Component({
  selector: 'app-dashboard-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
})
export class DashboardFiltersComponent {
  private store = inject(Store);

  readonly apiaries = input.required<Apiary[]>();

  readonly apiaryChange = output<number>();
  readonly beehiveChange = output<number>();

  private allBeehives = this.store.selectSignal(selectAllBeehives);
  selectedApiary = signal<number>(0);
  selectedBeehive = 0;

  beehives = computed(() =>
    this.selectedApiary() === 0
      ? []
      : this.allBeehives().filter(b => b.apiaryId === this.selectedApiary())
  );

  onApiaryChange(apiaryId: number): void {
    this.selectedApiary.set(apiaryId);
    this.selectedBeehive = 0;
    this.apiaryChange.emit(apiaryId);
  }

  onBeehiveChange(beehiveId: number): void {
    this.beehiveChange.emit(beehiveId);
  }
}
