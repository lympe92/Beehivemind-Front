import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Beehive } from '../../core/models/beehive.model';

export const BeehivesActions = createActionGroup({
  source: 'Beehives',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ beehives: Beehive[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});