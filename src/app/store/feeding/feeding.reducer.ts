import { createReducer, on } from '@ngrx/store';
import { FeedingActions } from './feeding.actions';
import { initialFeedingState } from './feeding.state';

export const feedingReducer = createReducer(
  initialFeedingState,

  on(FeedingActions.load, (state) => ({ ...state, loading: true, error: null })),

  on(FeedingActions.reload, (state) => ({ ...state, loading: true, loaded: false, error: null })),

  on(FeedingActions.loadSuccess, (state, { feeding }) => ({
    ...state, feeding, loading: false, loaded: true, error: null,
  })),

  on(FeedingActions.loadFailure, (state, { error }) => ({
    ...state, loading: false, loaded: false, error,
  })),
);
