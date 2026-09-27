import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestService } from './request.service';
import { ApiResponse } from '../models/api-response.model';
import { inlineErrors } from '../interceptors/error.interceptor';
import {
  AiMessage,
  ChatQuota,
  Conversation,
  SendMessageRequest,
  SendMessageResult,
} from '../models/ai-chat.model';

// ── API shapes (snake_case) ────────────────────────────────────────────────

interface MessagePayload {
  id: number;
  conversation_id: number;
  role: AiMessage['role'];
  status?: AiMessage['status'];
  content: string | null;
  error?: string | null;
  created_at: string;
}

interface ConversationPayload {
  id: number;
  beehive_id: number | null;
  title: string | null;
  status: Conversation['status'];
  last_message_at: string | null;
  created_at: string;
  messages?: MessagePayload[];
}

interface QuotaPayload {
  plan: ChatQuota['plan'];
  limit: number | null;
  used: number;
  remaining: number | null;
  resets_at: string;
}

interface SendPayload {
  conversation_id: number;
  message: MessagePayload;
  reply: MessagePayload;
  quota: QuotaPayload;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private request = inject(RequestService);

  /**
   * Stores the question and starts the reply. Answers at once with the reply
   * to poll. A spent allowance is a 429 the page renders itself (upgrade
   * callout), and an Ollama outage shows on the reply, so the global error
   * toast stays out of it.
   */
  sendMessage(payload: SendMessageRequest): Observable<SendMessageResult> {
    return this.request
      .postRequest<SendPayload>('ai/chat', payload, { context: inlineErrors() })
      .pipe(map(res => ({
        conversationId: res.data.conversation_id,
        message:        messageFromApi(res.data.message),
        reply:          messageFromApi(res.data.reply),
        quota:          quotaFromApi(res.data.quota),
      })));
  }

  /** One message, polled until the reply is done or failed. */
  getMessage(id: number): Observable<AiMessage> {
    return this.request
      .getRequest<MessagePayload>(`ai/messages/${id}`)
      .pipe(map(res => messageFromApi(res.data)));
  }

  /** Whether the assistant takes messages on this server (`AI_CHAT_ENABLED`). */
  getStatus(): Observable<boolean> {
    return this.request
      .getRequest<{ enabled: boolean }>('ai/status')
      .pipe(map(res => !!res.data?.enabled));
  }

  getQuota(): Observable<ChatQuota> {
    return this.request
      .getRequest<QuotaPayload>('ai/quota')
      .pipe(map(res => quotaFromApi(res.data)));
  }

  listConversations(): Observable<Conversation[]> {
    return this.request
      .getRequest<ConversationPayload[]>('ai/conversations')
      .pipe(map(res => (res.data ?? []).map(conversationFromApi)));
  }

  getConversation(id: number): Observable<Conversation> {
    return this.request
      .getRequest<ConversationPayload>(`ai/conversations/${id}`)
      .pipe(map(res => conversationFromApi(res.data)));
  }

  deleteConversation(id: number): Observable<ApiResponse<null>> {
    return this.request.deleteRequest(`ai/conversations/${id}`, {});
  }
}

// ── Mappers ───────────────────────────────────────────────────────────────

export function messageFromApi(m: MessagePayload): AiMessage {
  return {
    id:             m.id,
    conversationId: m.conversation_id,
    role:           m.role,
    status:         m.status ?? 'done',
    content:        m.content ?? '',
    error:          m.error ?? null,
    createdAt:      m.created_at,
  };
}

export function conversationFromApi(c: ConversationPayload): Conversation {
  return {
    id:            c.id,
    beehiveId:     c.beehive_id,
    title:         c.title,
    status:        c.status,
    lastMessageAt: c.last_message_at,
    createdAt:     c.created_at,
    ...(c.messages ? { messages: c.messages.map(messageFromApi) } : {}),
  };
}

export function quotaFromApi(q: QuotaPayload): ChatQuota {
  return {
    plan:      q.plan,
    limit:     q.limit,
    used:      q.used,
    remaining: q.remaining,
    resetsAt:  q.resets_at,
  };
}
