import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { BeehiveService } from '../../core/services/beehive.service';
import { BeehivesActions } from './beehives.actions';
import { selectBeehivesLoaded } from './beehives.selectors';

@Injectable()
export class BeehivesEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private beehiveService = inject(BeehiveService);

  // Load only if not already loaded
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BeehivesActions.load),
      withLatestFrom(this.store.select(selectBeehivesLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.beehiveService.getBeehives().pipe(
          map(res => BeehivesActions.loadSuccess({ beehives: res.data })),
          catchError(err =>
            of(BeehivesActions.loadFailure({ error: err?.message ?? 'Failed to load beehives' }))
          ),
        ),
      ),
    ),
  );

  // Force re-fetch (after mutations)
  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BeehivesActions.reload),
      switchMap(() =>
        this.beehiveService.getBeehives().pipe(
          map(res => BeehivesActions.loadSuccess({ beehives: res.data })),
          catchError(err =>
            of(BeehivesActions.loadFailure({ error: err?.message ?? 'Failed to load beehives' }))
          ),
        ),
      ),
    ),
  );
}