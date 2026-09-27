import { describe, it, expect } from 'vitest';
import { aiChatReducer } from './ai-chat.reducer';
import { AiChatActions } from './ai-chat.actions';
import { initialAiChatState } from './ai-chat.state';
import { AuthActions } from '../auth/auth.actions';
import { AiMessage, ChatQuota } from '../../core/models/ai-chat.model';

const msg = (id: number, role: AiMessage['role'], status: AiMessage['status'] = 'done', content = 'x'): AiMessage => ({
  id, conversationId: 1, role, status, content, error: null, createdAt: '2026-09-26T10:00:00Z',
});

const quota = (remaining: number | null, limit: number | null = 10): ChatQuota => ({
  plan: limit === null ? 'pro' : 'free', limit, used: limit === null ? 0 : limit - (remaining ?? 0), remaining, resetsAt: '2026-10-01T00:00:00Z',
});

describe('aiChatReducer', () => {
  it('shows the question at once and the reply only when it is done', () => {
    let state = aiChatReducer(initialAiChatState, AiChatActions.sendMessage({
      payload: { message: 'Hi' }, optimisticMessage: msg(-1, 'user', 'done', 'Hi'),
    }));
    expect(state.sending).toBe(true);
    expect(state.messages.map(m => m.id)).toEqual([-1]);

    state = aiChatReducer(state, AiChatActions.sendMessageSuccess({
      conversationId: 1, beehiveId: null, message: msg(5, 'user', 'done', 'Hi'), reply: msg(6, 'assistant', 'pending', ''), quota: quota(9),
    }));
    expect(state.sending).toBe(true);
    expect(state.pendingReplyId).toBe(6);
    expect(state.messages.map(m => m.id)).toEqual([5]);
    expect(state.activeConversationId).toBe(1);

    state = aiChatReducer(state, AiChatActions.replyReceived({ reply: msg(6, 'assistant', 'done', 'Hello.') }));
    expect(state.sending).toBe(false);
    expect(state.pendingReplyId).toBeNull();
    expect(state.messages.map(m => m.id)).toEqual([5, 6]);
  });

  it('keeps the question and reports the error when the reply fails', () => {
    let state = aiChatReducer(initialAiChatState, AiChatActions.sendMessageSuccess({
      conversationId: 1, beehiveId: null, message: msg(5, 'user'), reply: msg(6, 'assistant', 'pending', ''), quota: quota(9),
    }));
    state = aiChatReducer(state, AiChatActions.replyFailed({ replyId: 6, error: 'Ollama is down.' }));

    expect(state.sending).toBe(false);
    expect(state.sendError).toBe('Ollama is down.');
    expect(state.messages.map(m => m.id)).toEqual([5]);
  });

  it('locks the composer when the allowance is spent, from the send or from a 429', () => {
    let state = aiChatReducer(initialAiChatState, AiChatActions.sendMessageSuccess({
      conversationId: 1, beehiveId: null, message: msg(5, 'user'), reply: msg(6, 'assistant', 'pending', ''), quota: quota(0),
    }));
    expect(state.quotaExceeded).toBe(true);

    state = aiChatReducer(initialAiChatState, AiChatActions.sendMessageFailure({
      error: 'Spent.', quotaExceeded: true, quota: quota(0),
    }));
    expect(state.quotaExceeded).toBe(true);
    expect(state.quota?.remaining).toBe(0);
    expect(state.messages).toEqual([]);

    state = aiChatReducer(initialAiChatState, AiChatActions.loadQuotaSuccess({ quota: quota(null, null) }));
    expect(state.quotaExceeded).toBe(false);
  });

  it('builds the conversation from the first send, hive included, and takes its title from the list', () => {
    let state = aiChatReducer(initialAiChatState, AiChatActions.sendMessageSuccess({
      conversationId: 7, beehiveId: 12, message: msg(5, 'user', 'done', 'Syrup or fondant?'), reply: msg(6, 'assistant', 'pending', ''), quota: quota(9),
    }));
    expect(state.activeConversation?.id).toBe(7);
    expect(state.activeConversation?.beehiveId).toBe(12);
    expect(state.activeConversation?.title).toBe('Syrup or fondant?');

    state = aiChatReducer(state, AiChatActions.loadConversationsSuccess({
      conversations: [{ id: 7, beehiveId: 12, title: 'Syrup or fondant', status: 'active', lastMessageAt: 'l', createdAt: 'c' }],
    }));
    expect(state.activeConversation?.title).toBe('Syrup or fondant');

    // A later message in the same conversation keeps it.
    state = aiChatReducer(state, AiChatActions.sendMessageSuccess({
      conversationId: 7, beehiveId: null, message: msg(8, 'user'), reply: msg(9, 'assistant', 'pending', ''), quota: quota(8),
    }));
    expect(state.activeConversation?.beehiveId).toBe(12);
  });

  it('resumes polling a reply that was still pending when the conversation is reopened', () => {
    const state = aiChatReducer(initialAiChatState, AiChatActions.loadConversationSuccess({
      conversation: {
        id: 1, beehiveId: null, title: 't', status: 'active', lastMessageAt: null, createdAt: 'c',
        messages: [msg(1, 'user'), msg(2, 'assistant', 'pending', '')],
      },
    }));
    expect(state.sending).toBe(true);
    expect(state.pendingReplyId).toBe(2);
  });

  it('forgets everything when the account signs out', () => {
    let state = aiChatReducer(initialAiChatState, AiChatActions.loadConversationsSuccess({
      conversations: [{ id: 1, beehiveId: null, title: 'Mine', status: 'active', lastMessageAt: null, createdAt: 'c' }],
    }));
    expect(state.conversationsLoaded).toBe(true);

    state = aiChatReducer(state, AuthActions.logoutSuccess());
    expect(state).toEqual(initialAiChatState);
  });
});
