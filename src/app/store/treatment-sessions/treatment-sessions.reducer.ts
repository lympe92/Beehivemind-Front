import { createReducer, on } from '@ngrx/store';
import { TreatmentSessionsActions } from './treatment-sessions.actions';
import { initialTreatmentSessionsState } from './treatment-sessions.state';

export const treatmentSessionsReducer = createReducer(
  initialTreatmentSessionsState,

  on(TreatmentSessionsActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  on(TreatmentSessionsActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded:  false,
    error:   null,
  })),

  on(TreatmentSessionsActions.loadSuccess, (state, { sessions }) => ({
    ...state,
    sessions,
    loading: false,
    loaded:  true,
    error:   null,
  })),

  on(TreatmentSessionsActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded:  false,
    error,
  })),
);