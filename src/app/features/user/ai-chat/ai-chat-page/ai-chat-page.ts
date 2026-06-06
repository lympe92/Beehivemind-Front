import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AiChatActions } from '../../../../store/ai-chat/ai-chat.actions';
import {
  selectActiveConversation,
  selectActiveConversationId,
  selectActiveConversationLoading,
  selectMessages,
  selectSendError,
  selectSending,
} from '../../../../store/ai-chat/ai-chat.selectors';
import { AiMessage, SendMessageRequest } from '../../../../core/models/ai-chat.model';
import { DatePipe } from '@angular/common';
import { ConversationListComponent } from '../conversation-list/conversation-list';
import { ChatMessageComponent } from '../chat-message/chat-message';

const EXAMPLE_PROMPTS = [
  'How has my most active beehive been doing this month?',
  'When should I treat my hives for Varroa?',
  'Run a health diagnostic on my latest inspection records.',
];

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [DatePipe, ConversationListComponent, ChatMessageComponent],
  templateUrl: './ai-chat-page.html',
  styleUrl: './ai-chat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatPageComponent implements OnInit, AfterViewChecked {
  private store      = inject(Store);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private location   = inject(Location);
  private destroyRef = inject(DestroyRef);

  // ── NgRx signals ────────────────────────────────────────────
  activeConversationId = this.store.selectSignal(selectActiveConversationId);
  activeConversation   = this.store.selectSignal(selectActiveConversation);
  allMessages          = this.store.selectSignal(selectMessages);
  isSending            = this.store.selectSignal(selectSending);
  isLoadingHistory     = this.store.selectSignal(selectActiveConversationLoading);
  sendError            = this.store.selectSignal(selectSendError);

  // ── Local signals ────────────────────────────────────────────
  inputMessage = signal('');

  // ── Computed ─────────────────────────────────────────────────
  visibleMessages = computed(() =>
    this.allMessages().filter(m => m.role === 'user' || m.role === 'assistant')
  );
  characterCount = computed(() => this.inputMessage().length);
  canSend = computed(() =>
    this.inputMessage().trim().length > 0 &&
    this.inputMessage().length <= 4000 &&
    !this.isSending()
  );
  charWarning = computed(() => this.characterCount() > 3500);

  readonly examplePrompts = EXAMPLE_PROMPTS;

  // ── Scroll ───────────────────────────────────────────────────
  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private shouldScroll = false;

  // ── State ────────────────────────────────────────────────────
  private pendingInput = '';
  private isNewMode = true;

  constructor() {
    // Restore input when send fails
    effect(() => {
      const sending = this.isSending();
      if (!sending && this.pendingInput) {
        if (this.sendError()) {
          this.inputMessage.set(this.pendingInput);
        }
        this.pendingInput = '';
      }
    });

    // After first message of a new conversation: update URL without re-triggering route load
    effect(() => {
      const id = this.activeConversationId();
      if (id && this.isNewMode) {
        this.location.replaceState(`/user/ai-chat/${id}`);
        this.isNewMode = false;
      }
    });

    // Queue scroll to bottom whenever visible messages change
    effect(() => {
      this.visibleMessages();
      this.shouldScroll = true;
    });
  }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params['id'];
        if (id) {
          this.isNewMode = false;
          this.store.dispatch(AiChatActions.loadConversation({ id: Number(id) }));
        } else {
          this.isNewMode = true;
          this.store.dispatch(AiChatActions.clearActive());
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      const el = this.messagesContainer()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  // ── Actions ──────────────────────────────────────────────────

  newConversation(): void {
    this.isNewMode = true;
    this.router.navigate(['/user/ai-chat']);
  }

  selectConversation(id: number): void {
    this.router.navigate(['/user/ai-chat', id]);
  }

  sendMessage(): void {
    const content = this.inputMessage().trim();
    if (!content || !this.canSend()) return;

    const optimisticMessage: AiMessage = {
      id: -Date.now(),
      conversation_id: this.activeConversationId() ?? 0,
      role: 'user',
      content,
      tool_calls: null,
      tool_name: null,
      metadata: null,
      created_at: new Date().toISOString(),
    };

    const payload: SendMessageRequest = {
      message: content,
      ...(this.activeConversationId() ? { conversation_id: this.activeConversationId()! } : {}),
    };

    this.pendingInput = content;
    this.inputMessage.set('');

    this.store.dispatch(AiChatActions.sendMessage({ payload, optimisticMessage }));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onInput(event: Event): void {
    this.inputMessage.set((event.target as HTMLTextAreaElement).value);
  }

  tryPrompt(prompt: string): void {
    this.inputMessage.set(prompt);
    const textarea = document.querySelector<HTMLTextAreaElement>('.chat-input__textarea');
    textarea?.focus();
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
