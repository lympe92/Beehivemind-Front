import { AiMessage, Conversation } from '../../core/models/ai-chat.model';

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
  sending:    boolean;
  sendError:  string | null;
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

  messages:  [],
  sending:   false,
  sendError: null,
};
