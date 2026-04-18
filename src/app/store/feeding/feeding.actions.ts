import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Feeding } from '../../core/models/feeding.model';

export const FeedingActions = createActionGroup({
  source: 'Feeding',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ feeding: Feeding[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});