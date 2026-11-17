import { DiagnosisLevel } from '../../core/models/diagnosis.model';
import { OnboardingSummary } from '../../core/models/onboarding.model';

export interface OnboardingState {
  /** Null until the summary answers, and when it answered with something else. */
  data: OnboardingSummary | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  /** The level of the last diagnosis opened this session: `unknown` changes the tutorial's closing line. */
  lastDiagnosisLevel: DiagnosisLevel | null;
  /** The sidebar's "Getting started" was pressed: with every tutorial done it shows the list, not the closing card. */
  listAsked: boolean;
}

export const initialOnboardingState: OnboardingState = {
  data:               null,
  loading:            false,
  loaded:             false,
  error:              null,
  lastDiagnosisLevel: null,
  listAsked:          false,
};
