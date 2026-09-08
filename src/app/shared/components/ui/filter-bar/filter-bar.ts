import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Apiary } from '../../../../core/models/apiary.model';
import { Beehive } from '../../../../core/models/beehive.model';

/** The apiary / beehive scope selector. Styles: `.fb*` in styles/components/app/app.css. */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-bar.html',
})
export class FilterBarComponent {
  apiaries = input<Apiary[]>([]);
  beehives = input<Beehive[]>([]);
  apiaryId = model<number>(0);
  beehiveId = model<number>(0);
}
