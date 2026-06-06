import { createReducer, on } from '@ngrx/store';
import { AiChatActions } from './ai-chat.actions';
import { initialAiChatState } from './ai-chat.state';
import { Conversation } from '../../core/models/ai-chat.model';

export const aiChatReducer = createReducer(
  initialAiChatState,

  // ── Conversations list ────────────────────────────────────────
  on(AiChatActions.loadConversations, state => ({
    ...state, conversationsLoading: true, conversationsError: null,
  })),
  on(AiChatActions.loadConversationsSuccess, (state, { conversations }) => ({
    ...state, conversations, conversationsLoading: false, conversationsLoaded: true, conversationsError: null,
  })),
  on(AiChatActions.loadConversationsFailure, (state, { error }) => ({
    ...state, conversationsLoading: false, conversationsError: error,
  })),

  // ── Active conversation ───────────────────────────────────────
  on(AiChatActions.loadConversation, (state, { id }) => ({
    ...state,
    activeConversationId:      id,
    activeConversation:        null,
    activeConversationLoading: true,
    activeConversationError:   null,
    messages:                  [],
    sendError:                 null,
  })),
  on(AiChatActions.loadConversationSuccess, (state, { conversation }) => ({
    ...state,
    activeConversation:        conversation,
    activeConversationId:      conversation.id,
    activeConversationLoading: false,
    messages:                  conversation.messages ?? [],
  })),
  on(AiChatActions.loadConversationFailure, (state, { error }) => ({
    ...state, activeConversationLoading: false, activeConversationError: error,
  })),

  // ── Send message ──────────────────────────────────────────────
  on(AiChatActions.sendMessage, (state, { optimisticMessage }) => ({
    ...state,
    sending:   true,
    sendError: null,
    messages:  [...state.messages, optimisticMessage],
  })),
  on(AiChatActions.sendMessageSuccess, (state, { conversationId, message }) => {
    const messages = state.messages
      .filter(m => m.id > 0)   // drop optimistic (temp id is negative)
      .concat(message);

    const existing = state.conversations.find(c => c.id === conversationId);
    const conversations: Conversation[] = existing
      ? state.conversations.map(c =>
          c.id === conversationId ? { ...c, last_message_at: message.created_at } : c
        )
      : state.conversations; // new conversation — reload will populate

    return {
      ...state,
      sending:             false,
      sendError:           null,
      messages,
      conversations,
      activeConversationId: conversationId,
      activeConversation:   state.activeConversation
        ? { ...state.activeConversation, id: conversationId }
        : null,
    };
  }),
  on(AiChatActions.sendMessageFailure, (state, { error }) => ({
    ...state,
    sending:   false,
    sendError: error,
    messages:  state.messages.filter(m => m.id > 0), // roll back optimistic
  })),

  // ── Delete conversation ───────────────────────────────────────
  on(AiChatActions.deleteConversationSuccess, (state, { id }) => ({
    ...state,
    conversations:      state.conversations.filter(c => c.id !== id),
    activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    activeConversation:   state.activeConversation?.id === id ? null : state.activeConversation,
    messages:             state.activeConversationId === id ? [] : state.messages,
  })),

  // ── Clear active ──────────────────────────────────────────────
  on(AiChatActions.clearActive, state => ({
    ...state,
    activeConversationId:      null,
    activeConversation:        null,
    activeConversationLoading: false,
    activeConversationError:   null,
    messages:                  [],
    sendError:                 null,
  })),
);
