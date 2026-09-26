/**
 * The assistant: a general beekeeping chat on the API's local model. It has
 * no tools and no access to the team's data, except the one hive the app
 * attaches when the chat is opened from a diagnosis. Replies are generated
 * in the background — a message arrives `pending` and is polled until it is
 * `done` or `failed`.
 */

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export type MessageStatus = 'pending' | 'done' | 'failed';
export type ConversationStatus = 'active' | 'archived' | 'deleted';

export interface AiMessage {
  id: number;
  conversationId: number;
  role: MessageRole;
  status: MessageStatus;
  content: string;
  /** Why a `failed` reply failed, in words for the beekeeper. */
  error: string | null;
  createdAt: string;
}

export interface Conversation {
  id: number;
  /** The hive whose data the assistant was given, when the chat was opened from one. */
  beehiveId: number | null;
  title: string | null;
  status: ConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  messages?: AiMessage[];
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: number;
  beehive_id?: number;
}

/** What POST ai/chat answers: the stored question and the reply to poll. */
export interface SendMessageResult {
  conversationId: number;
  message: AiMessage;
  reply: AiMessage;
  quota: ChatQuota;
}

/** How many messages the beekeeper may still send; `limit` is null on paid plans. */
export interface ChatQuota {
  plan: 'free' | 'pro' | 'enterprise';
  limit: number | null;
  used: number;
  remaining: number | null;
  resetsAt: string;
}

/** The 429 the API answers when the monthly allowance is spent. */
export interface QuotaExceededError {
  success: false;
  message: string;
  meta?: { code?: string; quota?: unknown };
}

/** How long the client keeps polling a reply before giving up. */
export const REPLY_POLL_INTERVAL_MS = 2500;
export const REPLY_POLL_TIMEOUT_MS = 3 * 60 * 1000;
