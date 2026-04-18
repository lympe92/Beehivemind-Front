import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeedingService } from '../../core/services/feeding.service';
import { FeedingActions } from './feeding.actions';
import { selectFeedingLoaded } from './feeding.selectors';

@Injectable()
export class FeedingEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private feedingService = inject(FeedingService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeedingActions.load),
      withLatestFrom(this.store.select(selectFeedingLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.feedingService.getAllFeeding().pipe(
          map(res => FeedingActions.loadSuccess({ feeding: res.data })),
          catchError(err =>
            of(FeedingActions.loadFailure({ error: err?.message ?? 'Failed to load feeding' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FeedingActions.reload),
      switchMap(() =>
        this.feedingService.getAllFeeding().pipe(
          map(res => FeedingActions.loadSuccess({ feeding: res.data })),
          catchError(err =>
            of(FeedingActions.loadFailure({ error: err?.message ?? 'Failed to load feeding' }))
          ),
        ),
      ),
    ),
  );
}
