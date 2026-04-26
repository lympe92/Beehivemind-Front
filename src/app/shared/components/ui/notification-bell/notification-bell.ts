import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { DatePipe } from '@angular/common';
import { NotificationsActions } from '../../../../store/notifications/notifications.actions';
import {
  selectAllNotifications,
  selectNotificationsLoading,
  selectUnreadCount,
} from '../../../../store/notifications/notifications.selectors';
import { Notification } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBellComponent implements OnInit {
  private store   = inject(Store);
  private elRef   = inject(ElementRef);

  notifications  = this.store.selectSignal(selectAllNotifications);
  unreadCount    = this.store.selectSignal(selectUnreadCount);
  loading        = this.store.selectSignal(selectNotificationsLoading);
  isOpen         = signal(false);

  badgeLabel = computed(() => {
    const c = this.unreadCount();
    return c > 99 ? '99+' : c > 0 ? String(c) : null;
  });

  ngOnInit(): void {
    this.store.dispatch(NotificationsActions.load());
  }

  toggle(): void {
    const opening = !this.isOpen();
    this.isOpen.set(opening);
    if (opening) {
      this.store.dispatch(NotificationsActions.reload());
    }
  }

  markRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    if (!notification.isRead) {
      this.store.dispatch(NotificationsActions.markRead({ id: notification.id }));
    }
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.store.dispatch(NotificationsActions.markAllRead());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}