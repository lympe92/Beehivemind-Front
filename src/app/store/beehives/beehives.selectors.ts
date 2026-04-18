import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BeehivesState } from './beehives.state';

export const selectBeehivesState = createFeatureSelector<BeehivesState>('beehives');

export const selectAllBeehives    = createSelector(selectBeehivesState, s => s.beehives);
export const selectBeehivesLoading = createSelector(selectBeehivesState, s => s.loading);
export const selectBeehivesLoaded  = createSelector(selectBeehivesState, s => s.loaded);
export const selectBeehivesError   = createSelector(selectBeehivesState, s => s.error);

// Filter by apiary — 0 means all
export const selectBeehivesByApiary = (apiaryId: number) =>
  createSelector(selectAllBeehives, (beehives) =>
    apiaryId === 0 ? beehives : beehives.filter(b => b.apiaryId === apiaryId)
  );

// Client-side paginated slice + meta
export const selectBeehivesPage = (page: number, perPage: number) =>
  createSelector(selectAllBeehives, (beehives) => ({
    items: beehives.slice((page - 1) * perPage, page * perPage),
    meta: {
      total:       beehives.length,
      total_pages: Math.ceil(beehives.length / perPage) || 1,
      page,
      per_page:    perPage,
    },
  }));
