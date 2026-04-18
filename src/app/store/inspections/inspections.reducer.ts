import { createReducer, on } from '@ngrx/store';
import { InspectionsActions } from './inspections.actions';
import { initialInspectionsState } from './inspections.state';

export const inspectionsReducer = createReducer(
  initialInspectionsState,

  on(InspectionsActions.load, (state) => ({ ...state, loading: true, error: null })),

  on(InspectionsActions.reload, (state) => ({ ...state, loading: true, loaded: false, error: null })),

  on(InspectionsActions.loadSuccess, (state, { inspections }) => ({
    ...state, inspections, loading: false, loaded: true, error: null,
  })),

  on(InspectionsActions.loadFailure, (state, { error }) => ({
    ...state, loading: false, loaded: false, error,
  })),
);
