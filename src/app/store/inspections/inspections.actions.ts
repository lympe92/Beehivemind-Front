import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Inspection } from '../../core/models/inspection.model';

export const InspectionsActions = createActionGroup({
  source: 'Inspections',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ inspections: Inspection[] }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
