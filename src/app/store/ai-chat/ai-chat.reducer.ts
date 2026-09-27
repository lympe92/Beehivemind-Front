import { createReducer, on } from '@ngrx/store';
import { AiChatActions } from './ai-chat.actions';
import { initialAiChatState } from './ai-chat.state';
import { AuthActions } from '../auth/auth.actions';

export const aiChatReducer = createReducer(
  initialAiChatState,

  // ── Conversations list ────────────────────────────────────────
  on(AiChatActions.loadConversations, state => ({
    ...state, conversationsLoading: true, conversationsError: null,
  })),
  on(AiChatActions.loadConversationsSuccess, (state, { conversations }) => {
    // A conversation started on this page was built from the send; the list
    // brings its stored title.
    const listed = conversations.find(c => c.id === state.activeConversation?.id);
    return {
      ...state,
      conversations,
      conversationsLoading: false,
      conversationsLoaded:  true,
      conversationsError:   null,
      activeConversation:   listed && state.activeConversation
        ? { ...state.activeConversation, ...listed, beehiveId: state.activeConversation.beehiveId ?? listed.beehiveId }
        : state.activeConversation,
    };
  }),
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
    sending:                   false,
    pendingReplyId:            null,
    sendError:                 null,
  })),
  on(AiChatActions.loadConversationSuccess, (state, { conversation }) => {
    // A reply still pending from an earlier visit: pick the polling back up.
    const pending = (conversation.messages ?? []).find(m => m.role === 'assistant' && m.status === 'pending');
    return {
      ...state,
      activeConversation:        conversation,
      activeConversationId:      conversation.id,
      activeConversationLoading: false,
      messages:                  conversation.messages ?? [],
      sending:                   !!pending,
      pendingReplyId:            pending?.id ?? null,
    };
  }),
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
  on(AiChatActions.sendMessageSuccess, (state, { conversationId, beehiveId, message, reply, quota }) => ({
    ...state,
    // The stored question replaces the optimistic one (negative id); the
    // pending reply is not shown until it is done — the thinking row is.
    messages:             state.messages.filter(m => m.id > 0).concat(message),
    pendingReplyId:       reply.id,
    quota,
    quotaExceeded:        quota.remaining === 0,
    activeConversationId: conversationId,
    // The first message of a new conversation creates it: the page then
    // shows it (and the hive it is about) like one it loaded, without a
    // second request. The list refresh brings the stored title.
    activeConversation:   state.activeConversation
      ? { ...state.activeConversation, id: conversationId, lastMessageAt: message.createdAt }
      : {
          id:            conversationId,
          beehiveId,
          title:         message.content.trim().slice(0, 60),
          status:        'active',
          lastMessageAt: message.createdAt,
          createdAt:     message.createdAt,
        },
  })),
  on(AiChatActions.sendMessageFailure, (state, { error, quotaExceeded, quota }) => ({
    ...state,
    sending:        false,
    pendingReplyId: null,
    sendError:      error,
    quotaExceeded:  quotaExceeded || state.quotaExceeded,
    quota:          quota ?? state.quota,
    messages:       state.messages.filter(m => m.id > 0), // roll back optimistic
  })),
  on(AiChatActions.replyReceived, (state, { reply }) => ({
    ...state,
    sending:        false,
    pendingReplyId: null,
    sendError:      null,
    messages:       state.messages.filter(m => m.id !== reply.id).concat(reply),
    conversations:  state.conversations.map(c =>
      c.id === reply.conversationId ? { ...c, lastMessageAt: reply.createdAt } : c
    ),
  })),
  on(AiChatActions.replyFailed, (state, { replyId, error }) => ({
    ...state,
    sending:        false,
    pendingReplyId: null,
    sendError:      error,
    messages:       state.messages.filter(m => m.id !== replyId),
  })),

  // ── Delete conversation ───────────────────────────────────────
  on(AiChatActions.deleteConversationSuccess, (state, { id }) => ({
    ...state,
    conversations:        state.conversations.filter(c => c.id !== id),
    activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    activeConversation:   state.activeConversation?.id === id ? null : state.activeConversation,
    messages:             state.activeConversationId === id ? [] : state.messages,
  })),

  // ── Quota ─────────────────────────────────────────────────────
  on(AiChatActions.loadQuotaSuccess, (state, { quota }) => ({
    ...state, quota, quotaExceeded: quota.remaining === 0,
  })),

  // ── Clear active ──────────────────────────────────────────────
  on(AiChatActions.clearActive, state => ({
    ...state,
    activeConversationId:      null,
    activeConversation:        null,
    activeConversationLoading: false,
    activeConversationError:   null,
    messages:                  [],
    sending:                   false,
    pendingReplyId:            null,
    sendError:                 null,
  })),

  // Conversations are the user's: the next account in this tab starts empty.
  on(
    AuthActions.logoutSuccess,
    AuthActions.accountDeleted,
    AuthActions.accountRemoved,
    AuthActions.sessionCleared,
    () => initialAiChatState,
  ),
);
