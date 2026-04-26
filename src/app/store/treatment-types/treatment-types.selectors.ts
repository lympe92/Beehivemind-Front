import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TreatmentTypesState } from './treatment-types.state';

export const selectTreatmentTypesState   = createFeatureSelector<TreatmentTypesState>('treatmentTypes');
export const selectAllTreatmentTypes     = createSelector(selectTreatmentTypesState, s => s.types);
export const selectTreatmentTypesLoading = createSelector(selectTreatmentTypesState, s => s.loading);
export const selectTreatmentTypesLoaded  = createSelector(selectTreatmentTypesState, s => s.loaded);
