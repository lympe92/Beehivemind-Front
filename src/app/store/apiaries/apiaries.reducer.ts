import { createReducer, on } from '@ngrx/store';
import { ApiariesActions } from './apiaries.actions';
import { initialApiariesState } from './apiaries.state';

export const apiariesReducer = createReducer(
  initialApiariesState,

  on(ApiariesActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  on(ApiariesActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded: false,
    error: null,
  })),

  on(ApiariesActions.loadSuccess, (state, { apiaries }) => ({
    ...state,
    apiaries,
    loading: false,
    loaded: true,
    error: null,
  })),

  on(ApiariesActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
);