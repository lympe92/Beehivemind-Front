import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { HarvestService } from '../../core/services/harvest.service';
import { HarvestActions } from './harvest.actions';
import { selectHarvestLoaded } from './harvest.selectors';

@Injectable()
export class HarvestEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private harvestService = inject(HarvestService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HarvestActions.load),
      withLatestFrom(this.store.select(selectHarvestLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.harvestService.getAllHarvest().pipe(
          map(res => HarvestActions.loadSuccess({ harvest: res.data })),
          catchError(err =>
            of(HarvestActions.loadFailure({ error: err?.message ?? 'Failed to load harvest' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HarvestActions.reload),
      switchMap(() =>
        this.harvestService.getAllHarvest().pipe(
          map(res => HarvestActions.loadSuccess({ harvest: res.data })),
          catchError(err =>
            of(HarvestActions.loadFailure({ error: err?.message ?? 'Failed to load harvest' }))
          ),
        ),
      ),
    ),
  );
}
