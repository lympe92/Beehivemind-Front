import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, take } from 'rxjs';
import { OnboardingSeenKey, OnboardingState } from '../models/onboarding.model';
import { OnboardingService } from '../services/onboarding.service';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { OnboardingActions } from '../../store/onboarding/onboarding.actions';

/**
 * The setup wizard's apiary step, for everyone who should see it and has not:
 * an email sign-up confirms, signs in and would otherwise land on an empty
 * dashboard, since /auth/complete-profile is reached only after a new Google
 * or Apple sign-in. Offered once: `wizard` in the guide's seen keys (stored
 * on Skip and on success) keeps it from coming back in a later session, and
 * a flag in sessionStorage keeps it from coming back in this one, even before
 * the API has stored the key.
 */
export interface WizardFacts {
  isEditor: boolean;
  onboarding: OnboardingState | null | undefined;
  seen: readonly OnboardingSeenKey[];
  apiaries: number;
  offeredThisSession: boolean;
}

export function shouldOfferWizard(f: WizardFacts): boolean {
  return !f.isEditor
    && f.onboarding === 'active'
    && !f.seen.includes('wizard')
    && f.apiaries === 0
    && !f.offeredThisSession;
}

const OFFERED_KEY = 'bhm_wizard_offered';

export function wizardOfferedThisSession(): boolean {
  try { return sessionStorage.getItem(OFFERED_KEY) === '1'; } catch { return false; }
}

export function markWizardOffered(): void {
  try { sessionStorage.setItem(OFFERED_KEY, '1'); } catch {}
}

/**
 * On the /user zone's routes, so it runs once on entering /user (not between
 * its pages) and before the dashboard renders. Its one request is the guide's
 * summary, which the hub reads next anyway. Anything unexpected lets the
 * user through: this guard must never stand between someone and their data.
 */
export const wizardRedirectGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID)) || wizardOfferedThisSession()) return true;

  const store   = inject(Store);
  const router  = inject(Router);
  const service = inject(OnboardingService);

  return store.select(selectCurrentUser).pipe(
    take(1),
    switchMap(u => {
      if (!u || u.team?.role === 'editor') return of(true);
      // What the session knew at sign-in rules it out without asking.
      if (u.onboarding !== undefined && u.onboarding !== 'active') return of(true);
      if (u.onboarding_progress?.seen?.includes('wizard')) return of(true);
      return askSummary();
    }),
  );

  function askSummary() {
    // No timeout operator: its few hundred bytes would land in the initial
    // bundle. An API that is down fails fast, and the catch lets them through.
    return service.getSummary().pipe(
      map(res => {
        const summary = res.success ? res.data : null;
        // The hub reads the same answer: it need not ask again.
        store.dispatch(OnboardingActions.loadSuccess({ summary }));
        if (!summary) return true;
        const offer = shouldOfferWizard({
          isEditor: false,
          onboarding: summary.onboarding,
          seen: summary.progress.seen,
          apiaries: summary.apiaries,
          offeredThisSession: wizardOfferedThisSession(),
        });
        if (!offer) return true;
        markWizardOffered();
        return router.createUrlTree(['/auth/complete-profile']);
      }),
      catchError(() => of(true)),
    );
  }
};
