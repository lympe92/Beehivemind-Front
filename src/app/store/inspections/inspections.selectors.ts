import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InspectionsState } from './inspections.state';

export const selectInspectionsState = createFeatureSelector<InspectionsState>('inspections');

export const selectAllInspections    = createSelector(selectInspectionsState, s => s.inspections);
export const selectInspectionsLoading = createSelector(selectInspectionsState, s => s.loading);
export const selectInspectionsLoaded  = createSelector(selectInspectionsState, s => s.loaded);
export const selectInspectionsError   = createSelector(selectInspectionsState, s => s.error);