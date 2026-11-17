import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, concatMap, EMPTY, filter, merge, mergeMap, Observable, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiWrites } from '../../core/interceptors/api-writes.interceptor';
import { OnboardingStanding, OnboardingService } from '../../core/services/onboarding.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { OnboardingStateChange } from '../../core/models/onboarding.model';
import { OnboardingActions } from './onboarding.actions';
import { selectGuideVisible, selectOnboardingLoaded, selectOnboardingSummary } from './onboarding.selectors';

@Injectable()
export class OnboardingEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private service  = inject(OnboardingService);
  private router   = inject(Router);
  private writes   = inject(ApiWrites);

  private fetch() {
    return this.service.getSummary().pipe(
      map(res => OnboardingActions.loadSuccess({ summary: res.success ? res.data : null })),
      catchError(err => of(OnboardingActions.loadFailure({ error: err?.message ?? 'Failed to load the guide' }))),
    );
  }

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.load),
      withLatestFrom(this.store.select(selectOnboardingLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() => this.fetch()),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.reload),
      switchMap(() => this.fetch()),
    ),
  );

  /** The writes one after the other, the last answer kept: `done` must reach the API before `closed`. */
  private postStates(states: OnboardingStateChange[]): Observable<ApiResponse<OnboardingStanding>> {
    const [first, ...rest] = states;
    return rest.reduce(
      (chain, s) => chain.pipe(concatMap(() => this.service.setState(s))),
      this.service.setState(first),
    );
  }

  /**
   * The hub ticks on its own: after the app's own successful writes to a
   * record endpoint (reload's switchMap keeps only the last of a burst), and on every page
   * change inside /user, which is where work done on the phone or by a team
   * member shows up. Only while the guide is showing; no polling.
   */
  refresh$ = createEffect(() =>
    merge(
      this.writes.done$,
      this.router.events.pipe(filter(e => e instanceof NavigationEnd && e.urlAfterRedirects.startsWith('/user'))),
    ).pipe(
      withLatestFrom(this.store.select(selectGuideVisible)),
      filter(([, visible]) => visible),
      map(() => OnboardingActions.reload()),
    ),
  );

  setState$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.setState),
      concatMap(({ states }) =>
        this.postStates(states).pipe(
          map(res => OnboardingActions.saved({ standing: res.data })),
          catchError(() => of(OnboardingActions.reload())),
        ),
      ),
    ),
  );

  setPanel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.setPanel),
      concatMap(({ panel }) =>
        this.service.updateProgress({ panel }).pipe(
          map(res => OnboardingActions.saved({ standing: res.data })),
          catchError(() => of(OnboardingActions.reload())),
        ),
      ),
    ),
  );

  reopen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.reopen),
      concatMap(() =>
        this.service.setState('active').pipe(
          concatMap(() => this.service.updateProgress({ panel: 'open' })),
          // Reopened after a while: the counts are read again too.
          mergeMap(res => [OnboardingActions.saved({ standing: res.data }), OnboardingActions.reload()]),
          catchError(() => of(OnboardingActions.reload())),
        ),
      ),
    ),
  );

  markSeen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OnboardingActions.markSeen),
      withLatestFrom(this.store.select(selectOnboardingSummary)),
      filter(([{ key }, summary]) => !summary?.progress.seen.includes(key)),
      concatMap(([{ key }]) =>
        this.service.updateProgress({ seen: [key] }).pipe(
          map(res => OnboardingActions.saved({ standing: res.data })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );
}
