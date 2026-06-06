import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AiMessage, Conversation, SendMessageRequest } from '../../core/models/ai-chat.model';

export const AiChatActions = createActionGroup({
  source: 'AiChat',
  events: {
    'Load Conversations':         emptyProps(),
    'Load Conversations Success': props<{ conversations: Conversation[] }>(),
    'Load Conversations Failure': props<{ error: string }>(),

    'Load Conversation':         props<{ id: number }>(),
    'Load Conversation Success': props<{ conversation: Conversation }>(),
    'Load Conversation Failure': props<{ error: string }>(),

    'Send Message':         props<{ payload: SendMessageRequest; optimisticMessage: AiMessage }>(),
    'Send Message Success': props<{ conversationId: number; message: AiMessage }>(),
    'Send Message Failure': props<{ error: string }>(),

    'Delete Conversation':         props<{ id: number }>(),
    'Delete Conversation Success': props<{ id: number }>(),
    'Delete Conversation Failure': props<{ error: string }>(),

    'Clear Active': emptyProps(),
  },
});

