import { createReducer, on } from '@ngrx/store';
import { TreatmentTypesActions } from './treatment-types.actions';
import { initialTreatmentTypesState } from './treatment-types.state';

export const treatmentTypesReducer = createReducer(
  initialTreatmentTypesState,

  on(TreatmentTypesActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  on(TreatmentTypesActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded:  false,
    error:   null,
  })),

  on(TreatmentTypesActions.loadSuccess, (state, { types }) => ({
    ...state,
    types,
    loading: false,
    loaded:  true,
    error:   null,
  })),

  on(TreatmentTypesActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded:  false,
    error,
  })),
);
