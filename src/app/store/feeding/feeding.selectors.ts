import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FeedingState } from './feeding.state';

export const selectFeedingState = createFeatureSelector<FeedingState>('feeding');

export const selectAllFeeding    = createSelector(selectFeedingState, s => s.feeding);
export const selectFeedingLoading = createSelector(selectFeedingState, s => s.loading);
export const selectFeedingLoaded  = createSelector(selectFeedingState, s => s.loaded);
export const selectFeedingError   = createSelector(selectFeedingState, s => s.error);