import { AiMessage, ChatQuota, Conversation } from '../../core/models/ai-chat.model';

export interface AiChatState {
  conversations:         Conversation[];
  conversationsLoading:  boolean;
  conversationsLoaded:   boolean;
  conversationsError:    string | null;

  activeConversationId:      number | null;
  activeConversation:        Conversation | null;
  activeConversationLoading: boolean;
  activeConversationError:   string | null;

  messages:   AiMessage[];
  /** From the send until the reply is done or failed. */
  sending:    boolean;
  /** The reply being polled. */
  pendingReplyId: number | null;
  sendError:  string | null;

  quota:         ChatQuota | null;
  /** The 429: the allowance is spent; the composer locks until next month. */
  quotaExceeded: boolean;
}

export const initialAiChatState: AiChatState = {
  conversations:         [],
  conversationsLoading:  false,
  conversationsLoaded:   false,
  conversationsError:    null,

  activeConversationId:      null,
  activeConversation:        null,
  activeConversationLoading: false,
  activeConversationError:   null,

  messages:       [],
  sending:        false,
  pendingReplyId: null,
  sendError:      null,

  quota:         null,
  quotaExceeded: false,
};
