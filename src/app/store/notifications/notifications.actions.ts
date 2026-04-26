import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Notification } from '../../core/models/notification.model';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    Load:                    emptyProps(),
    Reload:                  emptyProps(),
    'Load Success':          props<{ notifications: Notification[]; unreadCount: number }>(),
    'Load Failure':          props<{ error: string }>(),
    'Mark Read':             props<{ id: number }>(),
    'Mark Read Success':     props<{ notification: Notification }>(),
    'Mark Read Failure':     props<{ error: string }>(),
    'Mark All Read':         emptyProps(),
    'Mark All Read Success': emptyProps(),
    'Mark All Read Failure': props<{ error: string }>(),
  },
});