import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TeamState } from './team.state';

export const selectTeamState       = createFeatureSelector<TeamState>('team');
export const selectTeam            = createSelector(selectTeamState, s => s.data);
export const selectTeamMembers     = createSelector(selectTeamState, s => s.data?.members ?? []);
export const selectTeamInvitations = createSelector(selectTeamState, s => s.data?.invitations ?? []);
export const selectTeamLoading     = createSelector(selectTeamState, s => s.loading);
export const selectTeamLoaded      = createSelector(selectTeamState, s => s.loaded);
