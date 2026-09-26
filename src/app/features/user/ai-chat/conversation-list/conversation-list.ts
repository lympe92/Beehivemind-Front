import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { AiChatActions } from '../../../../store/ai-chat/ai-chat.actions';
import {
  selectConversations,
  selectConversationsLoading,
} from '../../../../store/ai-chat/ai-chat.selectors';
import { ToastService } from '../../../../shared/components/ui/toast/toast.service';
import { ModalService } from '../../../../core/modal/modal.service';
import { AiChatService } from '../../../../core/services/ai-chat.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './conversation-list.html',
  styleUrl: './conversation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationListComponent implements OnInit {
  private store   = inject(Store);
  private toast   = inject(ToastService);
  private modal   = inject(ModalService);
  private service = inject(AiChatService);

  activeId = input<number | null>(null);
  selected = output<number>();

  conversations = this.store.selectSignal(selectConversations);
  loading       = this.store.selectSignal(selectConversationsLoading);

  ngOnInit(): void {
    this.store.dispatch(AiChatActions.loadConversations());
  }

  select(id: number): void {
    this.selected.emit(id);
  }

  async delete(event: Event, id: number): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.modal.confirm({
      title: 'Delete conversation',
      message: 'Delete this conversation? Its messages cannot be recovered.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.service.deleteConversation(id).subscribe({
      next: res => {
        if (res.success) {
          this.store.dispatch(AiChatActions.deleteConversationSuccess({ id }));
          this.toast.success('Conversation deleted.');
        } else {
          this.toast.error('Something went wrong. Please try again.');
        }
      },
      error: () => {},
    });
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
