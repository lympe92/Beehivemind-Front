import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { DiagnosisLevel } from '../../core/models/diagnosis.model';
import {
  OnboardingPanel,
  OnboardingSeenKey,
  OnboardingStateChange,
  OnboardingSummary,
} from '../../core/models/onboarding.model';
import { OnboardingStanding } from '../../core/services/onboarding.service';
import type { TutorialId } from '../../core/onboarding/tutorials';

export const OnboardingActions = createActionGroup({
  source: 'Onboarding',
  events: {
    Load:           emptyProps(),
    Reload:         emptyProps(),
    'Load Success': props<{ summary: OnboardingSummary | null }>(),
    'Load Failure': props<{ error: string }>(),

    /** Fold / Close / the all-done Close (`done`, then `closed`). */
    'Set State':    props<{ states: OnboardingStateChange[] }>(),
    'Set Panel':    props<{ panel: OnboardingPanel }>(),
    /** The sidebar's "Getting started": back to active and open, from any state. */
    Reopen:         emptyProps(),
    /** A page's help asks for its tutorial: the guide comes back as `Reopen` does, on that tutorial. */
    'Open Tutorial': props<{ id: TutorialId }>(),
    /** Something the guide cannot count was seen. Posted once; a key already stored is ignored. */
    'Mark Seen':    props<{ key: OnboardingSeenKey; level?: DiagnosisLevel }>(),
    /** What the API stored after any of the writes above. */
    'Saved':        props<{ standing: OnboardingStanding }>(),
  },
});
