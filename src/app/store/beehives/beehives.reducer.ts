import { createReducer, on } from '@ngrx/store';
import { BeehivesActions } from './beehives.actions';
import { initialBeehivesState } from './beehives.state';

export const beehivesReducer = createReducer(
  initialBeehivesState,

  on(BeehivesActions.load, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BeehivesActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null,
  })),

  on(BeehivesActions.loadSuccess, (state, { beehives }) => ({
    ...state,
    beehives,
    loading: false,
    loaded: true,
    error: null,
  })),

  on(BeehivesActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
);