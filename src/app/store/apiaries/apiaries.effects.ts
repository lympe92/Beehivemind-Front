import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiaryService } from '../../core/services/apiary.service';
import { ApiariesActions } from './apiaries.actions';
import { selectApiariesLoaded } from './apiaries.selectors';

@Injectable()
export class ApiariesEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private apiaryService = inject(ApiaryService);

  // Load only if not already loaded
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiariesActions.load),
      withLatestFrom(this.store.select(selectApiariesLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.apiaryService.getAllApiaries().pipe(
          map(res => ApiariesActions.loadSuccess({ apiaries: res.data })),
          catchError(err =>
            of(ApiariesActions.loadFailure({ error: err?.message ?? 'Failed to load apiaries' }))
          ),
        ),
      ),
    ),
  );

  // Force re-fetch (after mutations)
  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApiariesActions.reload),
      switchMap(() =>
        this.apiaryService.getAllApiaries().pipe(
          map(res => ApiariesActions.loadSuccess({ apiaries: res.data })),
          catchError(err =>
            of(ApiariesActions.loadFailure({ error: err?.message ?? 'Failed to load apiaries' }))
          ),
        ),
      ),
    ),
  );
}
