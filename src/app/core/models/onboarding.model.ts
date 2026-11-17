/**
 * Where an account stands in the "Getting started" guide, as the API keeps it
 * (`users.onboarding`). Null is "never started, or closed after all done".
 */
export type OnboardingState = 'active' | 'done' | 'dismissed';

/** What `POST user/onboarding` takes: `active` reopens from anything, `closed` sets null. */
export type OnboardingStateChange = OnboardingState | 'closed';

export type OnboardingPanel = 'open' | 'folded';

/**
 * The steps nothing in the database records, ticked by the app when the thing
 * is seen (`User::ONBOARDING_SEEN_KEYS`). `wizard` is not a step: it says the
 * setup wizard was finished or skipped, so it is never offered again.
 */
export type OnboardingSeenKey = 'diagnosis' | 'dashboard' | 'calendar' | 'export' | 'team' | 'wizard';

export interface OnboardingProgress {
  seen: OnboardingSeenKey[];
  panel: OnboardingPanel;
}

/** `GET user/onboarding/summary`: the team's counts every record step ticks from. */
export interface OnboardingSummary {
  apiaries: number;
  beehives: number;
  inspections: number;
  feedings: number;
  harvests: number;
  treatmentTypes: number;
  treatmentSessions: number;
  treatmentDosesDone: number;
  costs: number;
  costCategories: number;
  teamMembers: number;
  pendingInvitations: number;
  onboarding: OnboardingState | null;
  progress: OnboardingProgress;
}

export const EMPTY_PROGRESS: OnboardingProgress = { seen: [], panel: 'open' };
