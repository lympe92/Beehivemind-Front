import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { TreatmentSessionService } from '../../core/services/treatment-session.service';
import { TreatmentSessionsActions } from './treatment-sessions.actions';
import { selectTreatmentSessionsLoaded } from './treatment-sessions.selectors';

@Injectable()
export class TreatmentSessionsEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private service  = inject(TreatmentSessionService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TreatmentSessionsActions.load),
      withLatestFrom(this.store.select(selectTreatmentSessionsLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => TreatmentSessionsActions.loadSuccess({ sessions: res.data })),
          catchError(err =>
            of(TreatmentSessionsActions.loadFailure({ error: err?.message ?? 'Failed to load sessions' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TreatmentSessionsActions.reload),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => TreatmentSessionsActions.loadSuccess({ sessions: res.data })),
          catchError(err =>
            of(TreatmentSessionsActions.loadFailure({ error: err?.message ?? 'Failed to load sessions' }))
          ),
        ),
      ),
    ),
  );
}