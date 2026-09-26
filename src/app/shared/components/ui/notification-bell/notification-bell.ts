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
import { ModalService } from '../../../../core/modal/modal.service';
import { DiagnosisModalComponent } from '../modal/diagnosis-modal/diagnosis-modal';

/**
 * The header bell: unread badge, dropdown panel, per-item read and mark-all.
 * Closes on outside click and on Escape. Mounted once, in user-layout.
 * Styles: `.notif-*` in styles/components/app/app.css.
 */
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
  private modal   = inject(ModalService);

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

  /**
   * Read it, and where it points somewhere, go there: a hive's reading
   * (`hive_attention`, the morning diagnosis run) opens that hive's diagnosis.
   */
  async open(notification: Notification, event: Event): Promise<void> {
    this.markRead(notification, event);

    if (notification.type === 'hive_attention' && notification.entityType === 'beehive') {
      this.isOpen.set(false);
      await this.modal.open(DiagnosisModalComponent, {
        type: 'center',
        width: '640px',
        data: { beehiveId: notification.entityId, title: notification.title },
      });
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}
