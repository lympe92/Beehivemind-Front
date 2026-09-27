# AI Chat — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). Driven by the `aiChat` NgRx slice, registered **on the route** (`user.routes.ts`, `provideState` + `provideEffects`), not in the root store.

## Purpose
A general beekeeping assistant on the API's local model. **It has no tools and
cannot see the team's data** — the rules decide (see the Diagnosis section of
the root guide), the chat explains. The one exception: opened from a hive's
diagnosis (`?beehive=ID`), the API puts that hive's latest inspections and its
diagnosis in front of the model for that conversation.

## Routes (`user.routes.ts`, under `authGuard`)
| Path | Component | Role |
|------|-----------|------|
| `/user/ai-chat` | `ai-chat-page/ai-chat-page.ts` | New conversation (no id); `?beehive=ID` attaches a hive |
| `/user/ai-chat/:id` | same component | Existing conversation |

## Structure
| Component | Role |
|-----------|------|
| `ai-chat-page` | Container: context chip, thread, composer, allowance line, upgrade callout. `OnPush`. |
| `conversation-list/` | Sidebar list; delete goes service → `deleteConversationSuccess` → toast |
| `chat-message/` | Single message renderer (bold, italic, code, line breaks) |

## State & Data
- **Service/Models:** `core/services/ai-chat.service.ts`, `core/models/ai-chat.model.ts` (camelCase; `AiMessage.status` is `pending | done | failed`).
- **Sending is asynchronous.** `sendMessage` answers 202 with the stored question and a *pending* reply; the `pollReply$` effect polls `GET ai/messages/{id}` every 2.5 s for up to 3 minutes until it is `done` (`replyReceived`) or `failed` (`replyFailed`, with the API's `error` text). The thinking row shows while `sending`; the pending reply itself is hidden. Reopening a conversation with a pending reply resumes the poll.
- **The allowance.** `loadQuota` on init and the quota on every send: free plans see "n of 10 free messages left this month" under the composer; at 0 (or a 429 `quota_exceeded`) the composer locks and a warning callout links to `/pricing`. Paid plans show nothing.
- The chat POST carries `inlineErrors()`, so the global interceptor does not toast: the page renders the failure (callout) itself.
- The slice resets on `logoutSuccess` / `accountDeleted` / `accountRemoved` / `sessionCleared` — conversations are the user's.

## Patterns / gotchas
- **Optimistic send:** the question appears at once with a negative id and is replaced by the stored one on success. The input is restored only when the *send* failed, not when the reply did (the question is already saved).
- **URL sync without reload:** after the first message of a new conversation an `effect` calls `location.replaceState('/user/ai-chat/:id')`. The router still holds `/user/ai-chat`, so **"+ New chat" resets the page itself** (`startNew()`: `clearActive`, no hive) before navigating — a navigation to the same URL changes no param and the route subscription would never fire.
- **The conversation from the send:** `sendMessageSuccess` carries the hive the question was sent with, and the reducer builds `activeConversation` from it when none was loaded (the list refresh brings the stored title). That is what keeps the chip and the header after the first reply without a second request.
- **Context chip:** "About Beehive 12 · North Field" from the `beehives` and `apiaries` slices — from `?beehive=` before the first message (with "Ask without it", which clears the query param), from the conversation's `beehiveId` after it.
- **Composer:** the textarea is not `[value]`-bound; an `effect` writes the signal into the element when they differ. The one-way binding left the sent text in the disabled box when Angular saw no change.
- **Renderer:** `chat-message.ts` `formatContent()` (exported, `chat-message.spec.ts`) reads lists line by line (`-`/`*` bullets → `<ul>`, `1.` → `<ol>`) before the inline pass, so a `* item` is never the start of an italic run; paragraphs split on blank lines.
- `visibleMessages` filters to `user`/`assistant` with status other than `pending`. Send disabled when empty, > 4000 chars, sending, or the allowance is spent.

## Related
[Root](../../../../../CLAUDE.md) · `store/ai-chat/` · Diagnosis dialog's **Ask the assistant** (`shared/components/ui/modal/diagnosis-modal/`) · Admin: [AI Responses](../../admin/ai-responses/CLAUDE.md).
