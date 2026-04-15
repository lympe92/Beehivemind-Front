import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProfileState } from './profile.state';

export const selectProfileState = createFeatureSelector<ProfileState>('profile');

export const selectProfile          = createSelector(selectProfileState, (s) => s.data);
export const selectProfileLoading   = createSelector(selectProfileState, (s) => s.loading);
export const selectProfileSaving    = createSelector(selectProfileState, (s) => s.saving);
export const selectTfaSetupSecret   = createSelector(selectProfileState, (s) => s.tfaSetupSecret);
export const selectTfaSetupOtpauth  = createSelector(selectProfileState, (s) => s.tfaSetupOtpauthUrl);
export const selectTfaBackupCodes   = createSelector(selectProfileState, (s) => s.tfaBackupCodes);
