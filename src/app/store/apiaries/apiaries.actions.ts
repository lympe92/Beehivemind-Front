import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Apiary } from '../../core/models/apiary.model';

export const ApiariesActions = createActionGroup({
  source: 'Apiaries',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ apiaries: Apiary[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});