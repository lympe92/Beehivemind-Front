import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../../core/models/apiary.model';
import { Beehive } from '../../../../core/models/beehive.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBarComponent {
  apiaries = input<Apiary[]>([]);
  beehives = input<Beehive[]>([]);
  apiaryId = model<number>(0);
  beehiveId = model<number>(0);
}
