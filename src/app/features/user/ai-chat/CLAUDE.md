# AI Chat — Claude Guide

> Follows [root conventions](../../../../../CLAUDE.md). Driven by the `aiChat` NgRx slice. See also the auto-memory note `project_ai_chat.md`.

## Purpose
Conversational assistant over the user's beekeeping data. Conversation list + message thread with optimistic sending.

## Routes (`user.routes.ts`, under `authGuard`)
| Path | Component | Role |
|------|-----------|------|
| `/user/ai-chat` | `ai-chat-page/ai-chat-page.ts` | New conversation (no id) |
| `/user/ai-chat/:id` | same component | Existing conversation |

## Structure
| Component | Role |
|-----------|------|
| `ai-chat-page` | Container: thread, input, example prompts, scroll handling. `OnPush`. |
| `conversation-list/` | Sidebar list of conversations |
| `chat-message/` | Single message renderer |

## State & Data
- **Store:** `aiChat` slice. Selectors: `selectActiveConversationId`, `selectActiveConversation`, `selectMessages`, `selectSending`, `selectActiveConversationLoading`, `selectSendError`.
- **Actions:** `loadConversation({ id })`, `clearActive()`, `sendMessage({ payload, optimisticMessage })`.
- **Service/Models:** `core/services/ai-chat.service.ts`, `core/models/ai-chat.model.ts` (`AiMessage`, `SendMessageRequest`).

## Patterns / gotchas
- **Optimistic send:** `sendMessage()` builds an `optimisticMessage` (negative id) and dispatches immediately; clears the input. An `effect` restores the input text if `sendError()` is set after sending finishes.
- **URL sync without reload:** after the first message of a *new* conversation, an `effect` calls `location.replaceState('/user/ai-chat/:id')` (avoids re-triggering the route's `loadConversation`). Tracked via the private `isNewMode` flag.
- **Auto-scroll:** an `effect` flags `shouldScroll` on new visible messages; `ngAfterViewChecked` scrolls the container to the bottom.
- `visibleMessages` filters to `user`/`assistant` roles only (hides tool/system). Send disabled when empty, > 4000 chars, or already sending.

## Related
[Root](../../../../../CLAUDE.md) · `store/ai-chat/` · auto-memory `project_ai_chat.md`.
