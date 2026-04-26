import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { TreatmentSession } from '../../core/models/treatment-session.model';

export const TreatmentSessionsActions = createActionGroup({
  source: 'TreatmentSessions',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ sessions: TreatmentSession[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
