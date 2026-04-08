import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { EmployeeAuthService } from '../../core/services/employee-auth.service';
import { EmployeeAuthActions } from './employee-auth.actions';

@Injectable()
export class EmployeeAuthEffects {
  private actions$ = inject(Actions);
  private employeeAuthService = inject(EmployeeAuthService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeAuthActions.login),
      exhaustMap(({ email, password }) =>
        this.employeeAuthService.login(email, password).pipe(
          map(({ employee, token }) => EmployeeAuthActions.loginSuccess({ employee, token })),
          catchError((error) =>
            of(EmployeeAuthActions.loginFailure({ error: error.message ?? 'Login failed' })),
          ),
        ),
      ),
    ),
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeAuthActions.logout),
      tap(() => this.employeeAuthService.clearSession()),
      map(() => EmployeeAuthActions.logoutSuccess()),
    ),
  );
}