import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { InspectionService } from '../../core/services/inspection.service';
import { InspectionsActions } from './inspections.actions';
import { selectInspectionsLoaded } from './inspections.selectors';

@Injectable()
export class InspectionsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private inspectionService = inject(InspectionService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InspectionsActions.load),
      withLatestFrom(this.store.select(selectInspectionsLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.inspectionService.getAllInspections().pipe(
          map(res => InspectionsActions.loadSuccess({ inspections: res.data })),
          catchError(err =>
            of(InspectionsActions.loadFailure({ error: err?.message ?? 'Failed to load inspections' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InspectionsActions.reload),
      switchMap(() =>
        this.inspectionService.getAllInspections().pipe(
          map(res => InspectionsActions.loadSuccess({ inspections: res.data })),
          catchError(err =>
            of(InspectionsActions.loadFailure({ error: err?.message ?? 'Failed to load inspections' }))
          ),
        ),
      ),
    ),
  );
}
