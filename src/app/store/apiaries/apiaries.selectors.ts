import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ApiariesState } from './apiaries.state';

export const selectApiariesState = createFeatureSelector<ApiariesState>('apiaries');

export const selectAllApiaries   = createSelector(selectApiariesState, s => s.apiaries);
export const selectApiariesLoading = createSelector(selectApiariesState, s => s.loading);
export const selectApiariesLoaded  = createSelector(selectApiariesState, s => s.loaded);
export const selectApiariesError   = createSelector(selectApiariesState, s => s.error);

// Client-side paginated slice + meta — use as a factory: selectApiariesPage(page, perPage)
export const selectApiariesPage = (page: number, perPage: number) =>
  createSelector(selectAllApiaries, (apiaries) => ({
    items: apiaries.slice((page - 1) * perPage, page * perPage),
    meta: {
      total:       apiaries.length,
      total_pages: Math.ceil(apiaries.length / perPage) || 1,
      page,
      per_page:    perPage,
    },
  }));