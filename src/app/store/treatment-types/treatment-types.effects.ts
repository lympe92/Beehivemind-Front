import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { TreatmentTypeService } from '../../core/services/treatment-type.service';
import { TreatmentTypesActions } from './treatment-types.actions';
import { selectTreatmentTypesLoaded } from './treatment-types.selectors';

@Injectable()
export class TreatmentTypesEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private service  = inject(TreatmentTypeService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TreatmentTypesActions.load),
      withLatestFrom(this.store.select(selectTreatmentTypesLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => TreatmentTypesActions.loadSuccess({ types: res.data })),
          catchError(err =>
            of(TreatmentTypesActions.loadFailure({ error: err?.message ?? 'Failed to load treatment types' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TreatmentTypesActions.reload),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => TreatmentTypesActions.loadSuccess({ types: res.data })),
          catchError(err =>
            of(TreatmentTypesActions.loadFailure({ error: err?.message ?? 'Failed to load treatment types' }))
          ),
        ),
      ),
    ),
  );
}
