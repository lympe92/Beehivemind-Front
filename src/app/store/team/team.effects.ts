import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeamService } from '../../core/services/team.service';
import { TeamActions } from './team.actions';
import { selectTeamLoaded } from './team.selectors';

@Injectable()
export class TeamEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private service  = inject(TeamService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TeamActions.load),
      withLatestFrom(this.store.select(selectTeamLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.service.getTeam().pipe(
          map(res => TeamActions.loadSuccess({ team: res.data })),
          catchError(err =>
            of(TeamActions.loadFailure({ error: err?.message ?? 'Failed to load the team' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TeamActions.reload),
      switchMap(() =>
        this.service.getTeam().pipe(
          map(res => TeamActions.loadSuccess({ team: res.data })),
          catchError(err =>
            of(TeamActions.loadFailure({ error: err?.message ?? 'Failed to load the team' }))
          ),
        ),
      ),
    ),
  );
}
