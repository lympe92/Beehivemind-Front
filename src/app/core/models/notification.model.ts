export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: number;
  readAt: string | null;
  isRead: boolean;
  createdAt: string | null;
}

export interface NotificationsListResponse {
  success: boolean;
  data: Notification[];
  unread_count: number;
}