import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TreatmentSessionsState } from './treatment-sessions.state';

export const selectTreatmentSessionsState   = createFeatureSelector<TreatmentSessionsState>('treatmentSessions');
export const selectAllTreatmentSessions     = createSelector(selectTreatmentSessionsState, s => s.sessions);
export const selectTreatmentSessionsLoading = createSelector(selectTreatmentSessionsState, s => s.loading);
export const selectTreatmentSessionsLoaded  = createSelector(selectTreatmentSessionsState, s => s.loaded);