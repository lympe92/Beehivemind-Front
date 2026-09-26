import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DiagnosisLevel, diagnosisLevelBadgeClass, diagnosisLevelLabel } from '../../../../core/models/diagnosis.model';

/**
 * The one-word verdict of a diagnosis as a design-system badge: danger for
 * survival and attention, warning for watch, success for ok, an outline when
 * no rule matched or there is no reading yet.
 *
 * <app-diagnosis-badge [level]="row.level" />
 */
@Component({
  selector: 'app-diagnosis-badge',
  standalone: true,
  templateUrl: './diagnosis-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosisBadgeComponent {
  readonly level = input<DiagnosisLevel | null | undefined>(null);

  readonly label     = computed(() => diagnosisLevelLabel(this.level()));
  readonly toneClass = computed(() => diagnosisLevelBadgeClass(this.level()));
}
