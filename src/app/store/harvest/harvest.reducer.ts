import { createReducer, on } from '@ngrx/store';
import { HarvestActions } from './harvest.actions';
import { initialHarvestState } from './harvest.state';

export const harvestReducer = createReducer(
  initialHarvestState,

  on(HarvestActions.load, (state) => ({ ...state, loading: true, error: null })),

  on(HarvestActions.reload, (state) => ({ ...state, loading: true, loaded: false, error: null })),

  on(HarvestActions.loadSuccess, (state, { harvest }) => ({
    ...state, harvest, loading: false, loaded: true, error: null,
  })),

  on(HarvestActions.loadFailure, (state, { error }) => ({
    ...state, loading: false, loaded: false, error,
  })),
);