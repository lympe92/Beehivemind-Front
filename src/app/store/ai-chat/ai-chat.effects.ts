import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, filter, mergeMap, of, switchMap, takeUntil, takeWhile, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AiChatService, quotaFromApi } from '../../core/services/ai-chat.service';
import { AiAssistantStatusService } from '../../core/services/ai-assistant-status.service';
import { AiChatActions } from './ai-chat.actions';
import {
  AiMessage,
  QuotaExceededError,
  REPLY_POLL_INTERVAL_MS,
  REPLY_POLL_TIMEOUT_MS,
} from '../../core/models/ai-chat.model';

const GAVE_UP = 'The assistant is taking too long. Your message was saved — check back in a moment.';

@Injectable()
export class AiChatEffects {
  private actions$ = inject(Actions);
  private service  = inject(AiChatService);
  private status   = inject(AiAssistantStatusService);

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

  loadQuota$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.loadQuota),
      switchMap(() =>
        this.service.getQuota().pipe(
          map(quota => AiChatActions.loadQuotaSuccess({ quota })),
          catchError(() => of()),
        ),
      ),
    ),
  );

  /**
   * The send answers at once with the stored question and the pending reply.
   * A 429 is the spent allowance: the page shows the upgrade callout, so it
   * arrives as a failure with the quota rather than as a toast.
   */
  sendMessage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.sendMessage),
      switchMap(({ payload }) =>
        this.service.sendMessage(payload).pipe(
          mergeMap(({ conversationId, message, reply, quota }) => [
            AiChatActions.sendMessageSuccess({
              conversationId, message, reply, quota,
              beehiveId: payload.beehive_id ?? null,
            }),
            // The list shows the new conversation's title.
            AiChatActions.loadConversations(),
          ]),
          catchError((err: HttpErrorResponse) => {
            const body = err?.error as QuotaExceededError | null;
            const quotaExceeded = err?.status === 429 && body?.meta?.code === 'quota_exceeded';
            const rawQuota = body?.meta?.quota as Parameters<typeof quotaFromApi>[0] | undefined;

            // Switched off since the page loaded: the page locks itself.
            if (err?.status === 503 && body?.meta?.code === 'assistant_unavailable') this.status.markUnavailable();

            return of(AiChatActions.sendMessageFailure({
              error:         body?.message ?? 'Something went wrong. Please try again.',
              quotaExceeded,
              quota:         quotaExceeded && rawQuota ? quotaFromApi(rawQuota) : null,
            }));
          }),
        ),
      ),
    ),
  );

  /**
   * A failed reply is not charged (the API counts answered messages), so the
   * line under the composer goes back up.
   */
  refundFailed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.replyFailed),
      map(() => AiChatActions.loadQuota()),
    ),
  );

  /**
   * Poll the reply until it is done or failed. Every few seconds, for a few
   * minutes at most; a new send, another conversation or a cleared page
   * stops the previous poll.
   */
  pollReply$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AiChatActions.sendMessageSuccess, AiChatActions.loadConversationSuccess),
      map(action => 'reply' in action
        ? action.reply.id
        : (action.conversation.messages ?? []).find(m => m.role === 'assistant' && m.status === 'pending')?.id ?? null),
      filter((id): id is number => id !== null),
      switchMap(replyId => {
        const stop$ = this.actions$.pipe(
          ofType(AiChatActions.sendMessage, AiChatActions.loadConversation, AiChatActions.clearActive),
        );
        const deadline = Date.now() + REPLY_POLL_TIMEOUT_MS;

        return timer(REPLY_POLL_INTERVAL_MS, REPLY_POLL_INTERVAL_MS).pipe(
          takeUntil(stop$),
          switchMap(() => this.service.getMessage(replyId).pipe(catchError(() => of(null)))),
          map((reply: AiMessage | null) => {
            if (reply && reply.status === 'done') return AiChatActions.replyReceived({ reply });
            if (reply && reply.status === 'failed') {
              return AiChatActions.replyFailed({ replyId, error: reply.error ?? 'The assistant could not answer.' });
            }
            if (Date.now() > deadline) return AiChatActions.replyFailed({ replyId, error: GAVE_UP });
            return null;
          }),
          // Keep polling through nulls; the first real action ends the poll.
          takeWhile(action => action === null, true),
          filter((action): action is NonNullable<typeof action> => action !== null),
        );
      }),
    ),
  );
}
