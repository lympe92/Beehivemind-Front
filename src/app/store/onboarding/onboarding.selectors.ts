import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OnboardingState } from './onboarding.state';

/** Registered on the /user route (user.routes.ts), not in the root store. */
export const selectOnboardingState   = createFeatureSelector<OnboardingState>('onboarding');
export const selectOnboardingSummary = createSelector(selectOnboardingState, s => s?.data ?? null);
export const selectOnboardingLoading = createSelector(selectOnboardingState, s => s?.loading ?? false);
export const selectOnboardingLoaded  = createSelector(selectOnboardingState, s => s?.loaded ?? false);
export const selectLastDiagnosisLevel = createSelector(selectOnboardingState, s => s?.lastDiagnosisLevel ?? null);
export const selectGuideListAsked    = createSelector(selectOnboardingState, s => s?.listAsked ?? false);
export const selectAskedTutorial     = createSelector(selectOnboardingState, s => s?.askedTutorial ?? null);

/** The guide shows only while the API says `active`; an unknown or failed summary shows nothing. */
export const selectGuideVisible = createSelector(selectOnboardingSummary, d => d?.onboarding === 'active');
export const selectGuidePanel   = createSelector(selectOnboardingSummary, d => d?.progress.panel ?? 'open');
