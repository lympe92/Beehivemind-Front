import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, filter, of, switchMap, withLatestFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationsActions } from './notifications.actions';
import { selectNotificationsLoaded } from './notifications.selectors';

@Injectable()
export class NotificationsEffects {
  private actions$ = inject(Actions);
  private store    = inject(Store);
  private service  = inject(NotificationService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.load),
      withLatestFrom(this.store.select(selectNotificationsLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => NotificationsActions.loadSuccess(res)),
          catchError(err =>
            of(NotificationsActions.loadFailure({ error: err?.message ?? 'Failed to load notifications' }))
          ),
        ),
      ),
    ),
  );

  reload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.reload),
      switchMap(() =>
        this.service.getAll().pipe(
          map(res => NotificationsActions.loadSuccess(res)),
          catchError(err =>
            of(NotificationsActions.loadFailure({ error: err?.message ?? 'Failed to load notifications' }))
          ),
        ),
      ),
    ),
  );

  markRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markRead),
      switchMap(({ id }) =>
        this.service.markRead(id).pipe(
          map(res => NotificationsActions.markReadSuccess({ notification: res.data })),
          catchError(err =>
            of(NotificationsActions.markReadFailure({ error: err?.message ?? 'Failed to mark as read' }))
          ),
        ),
      ),
    ),
  );

  markAllRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.markAllRead),
      switchMap(() =>
        this.service.markAllRead().pipe(
          map(() => NotificationsActions.markAllReadSuccess()),
          catchError(err =>
            of(NotificationsActions.markAllReadFailure({ error: err?.message ?? 'Failed to mark all as read' }))
          ),
        ),
      ),
    ),
  );
}