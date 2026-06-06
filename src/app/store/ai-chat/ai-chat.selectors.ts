import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AiChatState } from './ai-chat.state';

export const selectAiChatState = createFeatureSelector<AiChatState>('aiChat');

export const selectConversations        = createSelector(selectAiChatState, s => s.conversations);
export const selectConversationsLoading = createSelector(selectAiChatState, s => s.conversationsLoading);
export const selectConversationsLoaded  = createSelector(selectAiChatState, s => s.conversationsLoaded);
export const selectConversationsError   = createSelector(selectAiChatState, s => s.conversationsError);

export const selectActiveConversationId      = createSelector(selectAiChatState, s => s.activeConversationId);
export const selectActiveConversation        = createSelector(selectAiChatState, s => s.activeConversation);
export const selectActiveConversationLoading = createSelector(selectAiChatState, s => s.activeConversationLoading);
export const selectActiveConversationError   = createSelector(selectAiChatState, s => s.activeConversationError);

export const selectMessages  = createSelector(selectAiChatState, s => s.messages);
export const selectSending   = createSelector(selectAiChatState, s => s.sending);
export const selectSendError = createSelector(selectAiChatState, s => s.sendError);
