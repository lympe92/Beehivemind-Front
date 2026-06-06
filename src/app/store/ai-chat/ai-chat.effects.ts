import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { AiChatService } from '../../core/services/ai-chat.service';
import { AiChatActions } from './ai-chat.actions';

@Injectable()
export class AiChatEffects {
  private actions$ = inject(Actions);
  private service  = inject(AiChatService);

  loadConversations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.loadConversations),
      switchMap(() =>
        this.service.listConversations().pipe(
          map(conversations => AiChatActions.loadConversationsSuccess({ conversations })),
          catchError(err =>
            of(AiChatActions.loadConversationsFailure({
              error: err?.error?.message ?? 'Failed to load conversations',
            }))
          ),
        ),
      ),
    ),
  );

  loadConversation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.loadConversation),
      switchMap(({ id }) =>
        this.service.getConversation(id).pipe(
          map(conversation => AiChatActions.loadConversationSuccess({ conversation })),
          catchError(err =>
            of(AiChatActions.loadConversationFailure({
              error: err?.error?.message ?? 'Failed to load conversation',
            }))
          ),
        ),
      ),
    ),
  );

  // switchMap is intentional: if user sends quickly, cancel the previous in-flight request
  sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.sendMessage),
      switchMap(({ payload }) =>
        this.service.sendMessage(payload).pipe(
          mergeMap(({ conversation_id, message }) => [
            AiChatActions.sendMessageSuccess({ conversationId: conversation_id, message }),
            // Reload the conversations list so the title appears for new conversations
            AiChatActions.loadConversations(),
          ]),
          catchError(err => {
            const apiErr = err?.error;
            let errorMsg = 'Something went wrong. Please try again.';
            if (apiErr?.message) errorMsg = apiErr.message;
            return of(AiChatActions.sendMessageFailure({ error: errorMsg }));
          }),
        ),
      ),
    ),
  );

  deleteConversation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.deleteConversation),
      mergeMap(({ id }) =>
        this.service.deleteConversation(id).pipe(
          map(() => AiChatActions.deleteConversationSuccess({ id })),
          catchError(err =>
            of(AiChatActions.deleteConversationFailure({
              error: err?.error?.message ?? 'Failed to delete conversation',
            }))
          ),
        ),
      ),
    ),
  );
}
