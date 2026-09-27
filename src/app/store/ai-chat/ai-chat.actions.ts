import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AiMessage, ChatQuota, Conversation, SendMessageRequest } from '../../core/models/ai-chat.model';

export const AiChatActions = createActionGroup({
  source: 'AiChat',
  events: {
    'Load Conversations':         emptyProps(),
    'Load Conversations Success': props<{ conversations: Conversation[] }>(),
    'Load Conversations Failure': props<{ error: string }>(),

    'Load Conversation':         props<{ id: number }>(),
    'Load Conversation Success': props<{ conversation: Conversation }>(),
    'Load Conversation Failure': props<{ error: string }>(),

    // The send stores the question and starts the reply; the reply is then
    // polled until it is done or failed. `beehiveId` is the hive the question
    // was sent with (a new conversation only), so the page can keep showing it.
    'Send Message':         props<{ payload: SendMessageRequest; optimisticMessage: AiMessage }>(),
    'Send Message Success': props<{ conversationId: number; beehiveId: number | null; message: AiMessage; reply: AiMessage; quota: ChatQuota }>(),
    'Send Message Failure': props<{ error: string; quotaExceeded: boolean; quota: ChatQuota | null }>(),
    'Reply Received':       props<{ reply: AiMessage }>(),
    'Reply Failed':         props<{ replyId: number; error: string }>(),

    'Delete Conversation Success': props<{ id: number }>(),

    'Load Quota':         emptyProps(),
    'Load Quota Success': props<{ quota: ChatQuota }>(),

    'Clear Active': emptyProps(),
  },
});
