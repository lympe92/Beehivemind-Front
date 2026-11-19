import { describe, it, expect } from 'vitest';
import { OnboardingSummary } from '../../core/models/onboarding.model';
import { AuthActions } from '../auth/auth.actions';
import { OnboardingActions } from './onboarding.actions';
import { nextGuideState, onboardingReducer } from './onboarding.reducer';
import { initialOnboardingState, OnboardingState } from './onboarding.state';

const summary: OnboardingSummary = {
  apiaries: 1, beehives: 1, inspections: 0, feedings: 0, harvests: 0,
  treatmentTypes: 0, treatmentSessions: 0, treatmentDosesDone: 0,
  costs: 0, costCategories: 0, teamMembers: 0, pendingInvitations: 0,
  onboarding: 'active', progress: { seen: ['dashboard'], panel: 'open' },
};

const loaded: OnboardingState = onboardingReducer(initialOnboardingState, OnboardingActions.loadSuccess({ summary }));

describe('nextGuideState', () => {
  it('follows the API: active reopens anything, closed empties, the rest leave empty as empty', () => {
    for (const from of ['active', 'done', 'dismissed', null] as const) {
      expect(nextGuideState(from, 'active')).toBe('active');
      expect(nextGuideState(from, 'closed')).toBeNull();
    }
    expect(nextGuideState('active', 'dismissed')).toBe('dismissed');
    expect(nextGuideState('active', 'done')).toBe('done');
    expect(nextGuideState(null, 'dismissed')).toBeNull();
    expect(nextGuideState(null, 'done')).toBeNull();
  });
});

describe('onboardingReducer', () => {
  it('loads once and keeps the counts on screen while they refresh', () => {
    expect(onboardingReducer(initialOnboardingState, OnboardingActions.load()).loading).toBe(true);
    expect(onboardingReducer(loaded, OnboardingActions.load())).toBe(loaded);

    const refreshing = onboardingReducer(loaded, OnboardingActions.reload());
    expect(refreshing.loading).toBe(true);
    expect(refreshing.data).toBe(summary);
  });

  it('stores an answer that was not a summary as none, loaded', () => {
    const s = onboardingReducer(initialOnboardingState, OnboardingActions.loadSuccess({ summary: null }));
    expect(s.data).toBeNull();
    expect(s.loaded).toBe(true);
  });

  it('keeps what it had when a refresh fails', () => {
    const s = onboardingReducer(loaded, OnboardingActions.loadFailure({ error: 'x' }));
    expect(s.data).toBe(summary);
    expect(s.loaded).toBe(true);
    expect(onboardingReducer(initialOnboardingState, OnboardingActions.loadFailure({ error: 'x' })).loaded).toBe(false);
  });

  it('applies Close and the all-done Close ahead of the API', () => {
    expect(onboardingReducer(loaded, OnboardingActions.setState({ states: ['dismissed'] })).data?.onboarding).toBe('dismissed');
    expect(onboardingReducer(loaded, OnboardingActions.setState({ states: ['done', 'closed'] })).data?.onboarding).toBeNull();
  });

  it('folds and reopens', () => {
    const folded = onboardingReducer(loaded, OnboardingActions.setPanel({ panel: 'folded' }));
    expect(folded.data?.progress).toEqual({ seen: ['dashboard'], panel: 'folded' });
    const dismissed = onboardingReducer(folded, OnboardingActions.setState({ states: ['dismissed'] }));
    const reopened = onboardingReducer(dismissed, OnboardingActions.reopen());
    expect(reopened.data?.onboarding).toBe('active');
    expect(reopened.data?.progress.panel).toBe('open');
  });

  it('remembers that the sidebar asked for the list, until the guide is closed again', () => {
    expect(loaded.listAsked).toBe(false);
    const reopened = onboardingReducer(loaded, OnboardingActions.reopen());
    expect(reopened.listAsked).toBe(true);
    expect(onboardingReducer(reopened, OnboardingActions.setState({ states: ['done', 'closed'] })).listAsked).toBe(false);
  });

  it('remembers the level of a diagnosis seen, and takes the key from the API’s answer', () => {
    const seen = onboardingReducer(loaded, OnboardingActions.markSeen({ key: 'diagnosis', level: 'unknown' }));
    expect(seen.lastDiagnosisLevel).toBe('unknown');
    expect(seen.data?.progress.seen).toEqual(['dashboard']);

    const saved = onboardingReducer(seen, OnboardingActions.saved({
      standing: { onboarding: 'active', progress: { seen: ['dashboard', 'diagnosis'], panel: 'open' } },
    }));
    expect(saved.data?.progress.seen).toEqual(['dashboard', 'diagnosis']);
    expect(saved.data?.apiaries).toBe(1);
  });

  it('keeps a seen key when a summary asked for before the write answers after it', () => {
    const stored = onboardingReducer(loaded, OnboardingActions.saved({
      standing: { onboarding: 'active', progress: { seen: ['team'], panel: 'open' } },
    }));
    const late = onboardingReducer(stored, OnboardingActions.loadSuccess({
      summary: { ...summary, apiaries: 2, progress: { seen: [], panel: 'open' } },
    }));
    expect(late.data?.progress.seen).toEqual(['team']);
    expect(late.data?.apiaries).toBe(2);
  });

  it('keeps the tutorial a page asked for, as a new request each time, until the guide is closed or reopened', () => {
    const asked = onboardingReducer(onboardingReducer(loaded, OnboardingActions.setState({ states: ['dismissed'] })), OnboardingActions.openTutorial({ id: 'feeding' }));
    expect(asked.askedTutorial).toEqual({ id: 'feeding' });
    expect(asked.data?.onboarding).toBe('active');
    expect(asked.data?.progress.panel).toBe('open');

    const again = onboardingReducer(asked, OnboardingActions.openTutorial({ id: 'feeding' }));
    expect(again.askedTutorial).not.toBe(asked.askedTutorial);

    expect(onboardingReducer(asked, OnboardingActions.reopen()).askedTutorial).toBeNull();
    expect(onboardingReducer(asked, OnboardingActions.setState({ states: ['dismissed'] })).askedTutorial).toBeNull();
    expect(onboardingReducer(initialOnboardingState, OnboardingActions.openTutorial({ id: 'costs' })).askedTutorial).toEqual({ id: 'costs' });
  });

  it('ignores writes before a summary exists', () => {
    expect(onboardingReducer(initialOnboardingState, OnboardingActions.setPanel({ panel: 'folded' })).data).toBeNull();
  });

  it('forgets everything on sign-out', () => {
    expect(onboardingReducer(loaded, AuthActions.logoutSuccess())).toEqual(initialOnboardingState);
  });
});
