import { createReducer, on } from '@ngrx/store';
import { OnboardingState as GuideState, OnboardingStateChange, OnboardingSummary } from '../../core/models/onboarding.model';
import { AuthActions } from '../auth/auth.actions';
import { OnboardingActions } from './onboarding.actions';
import { initialOnboardingState, OnboardingState } from './onboarding.state';

/**
 * The API's rule, applied ahead of its answer so Fold and Close respond at
 * once: `active` reopens from anything, `closed` empties it, and `done` /
 * `dismissed` leave an empty state empty.
 */
export function nextGuideState(current: GuideState | null, change: OnboardingStateChange): GuideState | null {
  if (change === 'active') return 'active';
  if (change === 'closed' || current === null) return null;
  return change;
}

function patch(state: OnboardingState, change: (d: OnboardingSummary) => OnboardingSummary): OnboardingState {
  return state.data ? { ...state, data: change(state.data) } : state;
}

/**
 * A summary asked for while a "seen" key was being stored can answer without
 * it and arrive after the write's own answer, which would untick the step
 * until the next page change. The API never takes a key off, so the keys
 * already known stay.
 */
function keepSeen(known: OnboardingSummary | null, summary: OnboardingSummary | null): OnboardingSummary | null {
  const missing = known?.progress.seen.filter(key => !summary?.progress.seen.includes(key)) ?? [];
  if (!summary || !missing.length) return summary;
  return { ...summary, progress: { ...summary.progress, seen: [...summary.progress.seen, ...missing] } };
}

export const onboardingReducer = createReducer(
  initialOnboardingState,

  on(OnboardingActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  // The counts stay on screen while they refresh: the hub must not blink on every navigation.
  on(OnboardingActions.reload, (state) => ({ ...state, loading: true, error: null })),

  on(OnboardingActions.loadSuccess, (state, { summary }) => ({
    ...state,
    data:    keepSeen(state.data, summary),
    loading: false,
    loaded:  true,
    error:   null,
  })),

  on(OnboardingActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded:  state.data !== null,
    error,
  })),

  on(OnboardingActions.setState, (state, { states }) =>
    patch({ ...state, listAsked: false }, d => ({ ...d, onboarding: states.reduce(nextGuideState, d.onboarding) }))
  ),

  on(OnboardingActions.setPanel, (state, { panel }) =>
    patch(state, d => ({ ...d, progress: { ...d.progress, panel } }))
  ),

  on(OnboardingActions.reopen, (state) =>
    patch({ ...state, listAsked: true }, d => ({ ...d, onboarding: 'active', progress: { ...d.progress, panel: 'open' } }))
  ),

  // The key itself is added by `saved`: the effect posts only what is not stored yet.
  on(OnboardingActions.markSeen, (state, { level }) =>
    level ? { ...state, lastDiagnosisLevel: level } : state
  ),

  on(OnboardingActions.saved, (state, { standing }) =>
    patch(state, d => ({ ...d, onboarding: standing.onboarding, progress: standing.progress }))
  ),

  // Another account signing in on this tab must never see this one's guide.
  on(
    AuthActions.logoutSuccess,
    AuthActions.accountDeleted,
    AuthActions.accountRemoved,
    AuthActions.sessionCleared,
    () => initialOnboardingState,
  ),
);
