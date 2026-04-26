import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.state';

export const selectNotificationsState   = createFeatureSelector<NotificationsState>('notifications');
export const selectAllNotifications     = createSelector(selectNotificationsState, s => s.notifications);
export const selectUnreadCount          = createSelector(selectNotificationsState, s => s.unreadCount);
export const selectNotificationsLoading = createSelector(selectNotificationsState, s => s.loading);
export const selectNotificationsLoaded  = createSelector(selectNotificationsState, s => s.loaded);
