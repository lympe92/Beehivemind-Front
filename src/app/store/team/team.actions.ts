import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Team } from '../../core/models/team.model';

export const TeamActions = createActionGroup({
  source: 'Team',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ team: Team }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
