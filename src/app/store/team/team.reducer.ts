import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '../auth/auth.actions';
import { TeamActions } from './team.actions';
import { initialTeamState } from './team.state';

export const teamReducer = createReducer(
  initialTeamState,

  on(TeamActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  on(TeamActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded:  false,
    error:   null,
  })),

  on(TeamActions.loadSuccess, (state, { team }) => ({
    ...state,
    data:    team,
    loading: false,
    loaded:  true,
    error:   null,
  })),

  on(TeamActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded:  false,
    error,
  })),

  // Another account signing in on this tab must never see this team's members.
  on(
    AuthActions.logoutSuccess,
    AuthActions.accountDeleted,
    AuthActions.accountRemoved,
    AuthActions.sessionCleared,
    () => initialTeamState,
  ),
);
