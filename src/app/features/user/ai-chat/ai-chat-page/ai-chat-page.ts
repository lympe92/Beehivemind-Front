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
import { DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { AiChatActions } from '../../../../store/ai-chat/ai-chat.actions';
import {
  selectActiveConversation,
  selectActiveConversationId,
  selectActiveConversationLoading,
  selectMessages,
  selectQuota,
  selectQuotaExceeded,
  selectSendError,
  selectSending,
} from '../../../../store/ai-chat/ai-chat.selectors';
import { AiMessage, SendMessageRequest } from '../../../../core/models/ai-chat.model';
import { selectAllBeehives } from '../../../../store/beehives/beehives.selectors';
import { BeehivesActions } from '../../../../store/beehives/beehives.actions';
import { selectAllApiaries } from '../../../../store/apiaries/apiaries.selectors';
import { ApiariesActions } from '../../../../store/apiaries/apiaries.actions';
import { ConversationListComponent } from '../conversation-list/conversation-list';
import { ChatMessageComponent } from '../chat-message/chat-message';
import { CardComponent } from '../../../../shared/components/ui/card/card';
import { CalloutComponent } from '../../../../shared/components/ui/callout/callout';

/** General questions: the assistant cannot see the beekeeper's data. */
const EXAMPLE_PROMPTS = [
  'When is honey ready to harvest?',
  'How do I tell European from American foulbrood?',
  'What should a September inspection look for?',
];

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [DatePipe, RouterLink, ConversationListComponent, ChatMessageComponent, CardComponent, CalloutComponent],
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
  quota                = this.store.selectSignal(selectQuota);
  quotaExceeded        = this.store.selectSignal(selectQuotaExceeded);
  private beehives     = this.store.selectSignal(selectAllBeehives);
  private apiaries     = this.store.selectSignal(selectAllApiaries);

  // ── Local signals ────────────────────────────────────────────
  inputMessage = signal('');

  /**
   * The hive whose data the assistant is given — from `?beehive=` when the
   * chat is opened from a diagnosis, or from the conversation once it has
   * one. Sent with the first message of a new conversation only; the API
   * keeps it on the conversation after that.
   */
  contextBeehiveId = signal<number | null>(null);

  // ── Computed ─────────────────────────────────────────────────
  visibleMessages = computed(() =>
    this.allMessages().filter(m => (m.role === 'user' || m.role === 'assistant') && m.status !== 'pending')
  );
  characterCount = computed(() => this.inputMessage().length);
  canSend = computed(() =>
    this.inputMessage().trim().length > 0 &&
    this.inputMessage().length <= 4000 &&
    !this.isSending() &&
    !this.quotaExceeded()
  );
  charWarning = computed(() => this.characterCount() > 3500);

  /** "Hive 12 · North Field", for the context chip. */
  contextLabel = computed(() => {
    const id = this.contextBeehiveId() ?? this.activeConversation()?.beehiveId ?? null;
    if (id === null) return null;
    const hive   = this.beehives().find(b => b.id === id);
    const apiary = hive ? this.apiaries().find(a => a.id === hive.apiaryId) : null;
    const name   = hive ? `Hive ${hive.name}` : `Hive #${id}`;
    return apiary ? `${name} · ${apiary.name}` : name;
  });

  /** The line under the composer on a free plan; nothing on a paid one. */
  quotaLabel = computed(() => {
    const q = this.quota();
    if (!q || q.limit === null) return null;
    const left = q.remaining ?? 0;
    return `${left} of ${q.limit} free message${q.limit === 1 ? '' : 's'} left this month`;
  });

  readonly examplePrompts = EXAMPLE_PROMPTS;

  // ── Scroll ───────────────────────────────────────────────────
  private messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private composer = viewChild<ElementRef<HTMLTextAreaElement>>('composer');
  private shouldScroll = false;

  // ── State ────────────────────────────────────────────────────
  private pendingInput = '';
  private isNewMode = true;

  constructor() {
    // Restore the input when the send itself failed (not when the reply did:
    // the question was stored, sending it again would duplicate it).
    effect(() => {
      const sending = this.isSending();
      if (!sending && this.pendingInput) {
        if (this.sendError() && this.allMessages().every(m => m.content !== this.pendingInput)) {
          this.inputMessage.set(this.pendingInput);
        }
        this.pendingInput = '';
      }
    });

    // After the first message of a new conversation: update the URL without
    // re-triggering the route load, and drop the query string with it.
    effect(() => {
      const id = this.activeConversationId();
      if (id && this.isNewMode) {
        this.location.replaceState(`/user/ai-chat/${id}`);
        this.isNewMode = false;
        this.contextBeehiveId.set(null);
      }
    });

    // Queue scroll to bottom whenever visible messages change
    effect(() => {
      this.visibleMessages();
      this.isSending();
      this.shouldScroll = true;
    });
  }

  ngOnInit(): void {
    this.store.dispatch(BeehivesActions.load());
    this.store.dispatch(ApiariesActions.load());
    this.store.dispatch(AiChatActions.loadQuota());

    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params['id'];
        if (id) {
          this.isNewMode = false;
          this.contextBeehiveId.set(null);
          this.store.dispatch(AiChatActions.loadConversation({ id: Number(id) }));
        } else {
          this.isNewMode = true;
          const beehive = Number(this.route.snapshot.queryParamMap.get('beehive'));
          this.contextBeehiveId.set(beehive > 0 ? beehive : null);
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

  dropContext(): void {
    this.contextBeehiveId.set(null);
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  sendMessage(): void {
    const content = this.inputMessage().trim();
    if (!content || !this.canSend()) return;

    const optimisticMessage: AiMessage = {
      id: -Date.now(),
      conversationId: this.activeConversationId() ?? 0,
      role: 'user',
      status: 'done',
      content,
      error: null,
      createdAt: new Date().toISOString(),
    };

    const conversationId = this.activeConversationId();
    const beehiveId = conversationId ? null : this.contextBeehiveId();

    const payload: SendMessageRequest = {
      message: content,
      ...(conversationId ? { conversation_id: conversationId } : {}),
      ...(beehiveId ? { beehive_id: beehiveId } : {}),
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
    this.composer()?.nativeElement.focus();
  }

  trackById(_: number, item: { id: number }): number {
    return item.id;
  }
}
