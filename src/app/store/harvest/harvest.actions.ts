import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Harvest } from '../../core/models/harvest.model';

export const HarvestActions = createActionGroup({
  source: 'Harvest',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ harvest: Harvest[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});