import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TreatmentType } from '../../core/models/treatment-type.model';

export const TreatmentTypesActions = createActionGroup({
  source: 'TreatmentTypes',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ types: TreatmentType[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
