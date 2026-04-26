import { Notification } from '../../core/models/notification.model';

export interface NotificationsState {
  notifications: Notification[];
  unreadCount:   number;
  loading:       boolean;
  loaded:        boolean;
  error:         string | null;
}

export const initialNotificationsState: NotificationsState = {
  notifications: [],
  unreadCount:   0,
  loading:       false,
  loaded:        false,
  error:         null,
};