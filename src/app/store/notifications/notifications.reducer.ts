import { createReducer, on } from '@ngrx/store';
import { NotificationsActions } from './notifications.actions';
import { initialNotificationsState } from './notifications.state';

export const notificationsReducer = createReducer(
  initialNotificationsState,

  on(NotificationsActions.load, (state) =>
    state.loaded ? state : { ...state, loading: true, error: null }
  ),

  on(NotificationsActions.reload, (state) => ({
    ...state,
    loading: true,
    loaded:  false,
    error:   null,
  })),

  on(NotificationsActions.loadSuccess, (state, { notifications, unreadCount }) => ({
    ...state,
    notifications,
    unreadCount,
    loading: false,
    loaded:  true,
    error:   null,
  })),

  on(NotificationsActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded:  false,
    error,
  })),

  on(NotificationsActions.markReadSuccess, (state, { notification }) => ({
    ...state,
    notifications: state.notifications.map(n =>
      n.id === notification.id ? notification : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),

  on(NotificationsActions.markAllReadSuccess, (state) => ({
    ...state,
    notifications: state.notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
    unreadCount:   0,
  })),
);