import { createFeatureSelector, createSelector } from '@ngrx/store';
import { HarvestState } from './harvest.state';

export const selectHarvestState = createFeatureSelector<HarvestState>('harvest');

export const selectAllHarvest    = createSelector(selectHarvestState, s => s.harvest);
export const selectHarvestLoading = createSelector(selectHarvestState, s => s.loading);
export const selectHarvestLoaded  = createSelector(selectHarvestState, s => s.loaded);
export const selectHarvestError   = createSelector(selectHarvestState, s => s.error);