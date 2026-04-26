export interface AgendaItem {
  type: string;
  title: string;
  subtitle: string;
  scheduledDate: string;
  isOverdue: boolean;
  entityType: string;
  entityId: number;
  sessionId?: number;
}